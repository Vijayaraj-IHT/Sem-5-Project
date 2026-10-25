import psycopg2

def main():
    conn = psycopg2.connect("postgresql://lexguard:lexguard123@localhost:5432/lexguard")
    cur = conn.cursor()
    
    cur.execute("ALTER TABLE cases ADD COLUMN IF NOT EXISTS comparison_profile JSONB;")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_cases_comparison_profile ON cases USING gin (comparison_profile);")
    conn.commit()
    print("Successfully added comparison_profile JSONB column and GIN index to cases table in PostgreSQL!")
    conn.close()

if __name__ == "__main__":
    main()
