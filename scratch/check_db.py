
import sqlite3

conn = sqlite3.connect('ticket.db')
cursor = conn.cursor()

print("Seats status:")
cursor.execute("SELECT seat_id, seat_number, status FROM seats LIMIT 10")
for row in cursor.fetchall():
    print(row)

cursor.execute("SELECT status, COUNT(*) FROM seats GROUP BY status")
print("\nCounts by status:")
for row in cursor.fetchall():
    print(row)

conn.close()
