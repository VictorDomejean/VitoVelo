#app.py
from flask import Flask, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash

import psycopg2 #pip install psycopg2 
import psycopg2.extras

app = Flask(__name__)

DB_HOST = "localhost"
DB_NAME = "gc_data"
DB_USER = "postgres"
DB_PASS = "admin"

# DB_HOST = "192.168.1.172"
# DB_NAME = "gc_data"
# DB_USER = "pi"
# DB_PASS = "admin"

conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST)

@app.route('/')
def home():
    # passhash = generate_password_hash('cairocoders')
    # print(passhash)
    return '<div>GPX Viewer API</div>'

@app.route('/activity_id') 
def get_activity_id():

    id = request.args.get('id')
    try:
        
        print("ID", id)
        conn = psycopg2.connect("dbname={} user={} password={}".format('gc_data', 'postgres', 'admin'))
        cursor = conn.cursor()

        if id:
            print(id)
            
            cursor.execute("""
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(
                    json_build_object(
                        'type',       'Feature',
                        'id',         uid,
                        'properties', jsonb_set(row_to_json(test)::jsonb,'{geom}','0',false),
                        'geometry',   ST_AsGeoJSON(geom)::json
                    )
                )
            )
            FROM (select uid, name, type, tracks.date, tracks.activity_id, duree, distance, ascension_totale, descente_totale, frequence_cardiaque_moyenne, frequence_cardiaque_maximale, calories, geom
            from gc.tracks
            LEFT JOIN gc.recap_activity ON tracks.activity_id = recap_activity.activity_id) as test
            where activity_id = %s
            """, (id,))

            row = cursor.fetchone()
            resp = jsonify(row)
            
            return resp
        
        else:
            resp = jsonify('User "id" not found in query string')
            resp.status_code = 500
            return resp

    except Exception as e:
        print(e)
    
    finally:
        cursor.close() 
        conn.close()


@app.route('/all') 
def get_all():
    
    try:
        conn = psycopg2.connect("dbname={} user={} password={}".format('gc_data', 'postgres', 'admin'))
        cursor = conn.cursor()
        
        cursor.execute("""
        SELECT 
        json_build_object(
            'activity',         all_unique,
            'geom',             ST_AsGeoJSON(geom)::json
        )
        
        FROM (
        SELECT DISTINCT activity_id as id, name, date, type, geom
        FROM gc.tracks 
        ORDER BY date DESC
        )as all_unique
        """)

        row = cursor.fetchall()
        resp = jsonify(row)
        
        return resp

    except Exception as e:
        print(e)
    
    finally:
        cursor.close() 
        conn.close()


@app.route('/activity_points') 
def get_activity_points():

    id = request.args.get('id')
    try:
        
        print("ID", id)
        conn = psycopg2.connect("dbname={} user={} password={}".format('gc_data', 'postgres', 'admin'))
        cursor = conn.cursor()

        if id:
            print(id)
            
            cursor.execute("""
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(
                    json_build_object(
                        'type',       'Feature',
                        'id',         uid,
                        'geometry',   ST_AsGeoJSON(geom)::json,
                        'properties', jsonb_set(row_to_json(track_points)::jsonb,'{geom}','0',false)
                    )
                )
                )
            FROM gc.track_points
            WHERE activity_id = %s 
            """, (id,))

            row = cursor.fetchone()
            resp = jsonify(row)
            
            return resp
        
        else:
            resp = jsonify('User "id" not found in query string')
            resp.status_code = 500
            return resp

    except Exception as e:
        print(e)
    
    finally:
        cursor.close() 
        conn.close()
    
@app.route('/startstop') 
def get_startstop():

    id = request.args.get('id')
    try:
        
        print("ID", id)
        conn = psycopg2.connect("dbname={} user={} password={}".format('gc_data', 'postgres', 'admin'))
        cursor = conn.cursor()

        if id:
            print(id)
            
            cursor.execute("""
            SELECT json_build_object(
                'type', 'FeatureCollection',
                'features', json_agg(
                    json_build_object(
                        'type',       'Feature',
                        'id',         uid,
                        'ele',        ele,
                        'time',       time,
                        'geometry',   ST_AsGeoJSON(geom)::json
                    )
                )
            ) FROM gc.track_points WHERE track_seg_point_id IN ((SELECT MAX (track_seg_point_id) FROM gc.track_points WHERE activity_id = %s), (SELECT MIN (track_seg_point_id) FROM gc.track_points WHERE activity_id = %s)) AND activity_id = %s
            """, (id,id,id,))

            row = cursor.fetchone()
            resp = jsonify(row)
            
            return resp
        
        else:
            resp = jsonify('User "id" not found in query string')
            resp.status_code = 500
            return resp

    except Exception as e:
        print(e)
    
    finally:
        cursor.close() 
        conn.close()


if __name__ == "__main__":
    app.run()