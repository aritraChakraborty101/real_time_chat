package database

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB() error {
	var err error
	DB, err = sql.Open("sqlite3", "./chat.db")
	if err != nil {
		return err
	}

	if err = DB.Ping(); err != nil {
		return err
	}

	if err = createTables(); err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

func createTables() error {
	usersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT UNIQUE NOT NULL,
		username TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		display_name TEXT,
		bio TEXT,
		profile_picture TEXT,
		is_verified BOOLEAN DEFAULT FALSE,
		verification_token TEXT,
		reset_token TEXT,
		reset_token_expires DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
	CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
	CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
	`

	friendshipsTable := `
	CREATE TABLE IF NOT EXISTS friendships (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		friend_id INTEGER NOT NULL,
		status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'rejected', 'blocked')),
		requested_by INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user_id, friend_id)
	);
	CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
	CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
	CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
	`

	_, err := DB.Exec(usersTable)
	if err != nil {
		return err
	}

	_, err = DB.Exec(friendshipsTable)
	return err
}

func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}
