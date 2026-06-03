import psycopg2

host = 'aws-1-ap-southeast-2.pooler.supabase.com'
port = 6543
dbname = 'postgres'
user = 'postgres.scwwzjnyiapskutqqotw'
password = 'vatsalpranay123'

for mode in ['disable', 'require', 'prefer']:
    try:
        conn = psycopg2.connect(
            host=host, port=port, dbname=dbname,
            user=user, password=password,
            connect_timeout=10, sslmode=mode
        )
        print(f'CONNECTED OK - sslmode={mode}')
        conn.close()
    except Exception as e:
        print(f'FAILED sslmode={mode}: {e}')
