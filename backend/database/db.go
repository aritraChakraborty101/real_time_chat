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

	conversationsTable := `
	CREATE TABLE IF NOT EXISTS conversations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user1_id INTEGER NOT NULL,
		user2_id INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user1_id, user2_id),
		CHECK(user1_id < user2_id)
	);
	CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
	CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
	`

	messagesTable := `
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		conversation_id INTEGER NOT NULL,
		sender_id INTEGER NOT NULL,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
		FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
	);
	CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
	CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
	CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
	`

	groupsTable := `
	CREATE TABLE IF NOT EXISTS groups (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		description TEXT,
		group_picture TEXT,
		created_by INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
	);
	CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
	`

	groupMembersTable := `
	CREATE TABLE IF NOT EXISTS group_members (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		group_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'member')),
		joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(group_id, user_id)
	);
	CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
	CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
	`

	groupMessagesTable := `
	CREATE TABLE IF NOT EXISTS group_messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		group_id INTEGER NOT NULL,
		sender_id INTEGER NOT NULL,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
		FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
	);
	CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
	CREATE INDEX IF NOT EXISTS idx_group_messages_sender ON group_messages(sender_id);
	CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);
	`

	_, err := DB.Exec(usersTable)
	if err != nil {
		return err
	}

	_, err = DB.Exec(friendshipsTable)
	if err != nil {
		return err
	}

	_, err = DB.Exec(conversationsTable)
	if err != nil {
		return err
	}

	_, err = DB.Exec(messagesTable)
	if err != nil {
		return err
	}

	_, err = DB.Exec(groupsTable)
	if err != nil {
		return err
	}

	_, err = DB.Exec(groupMembersTable)
	if err != nil {
		return err
	}

	_, err = DB.Exec(groupMessagesTable)
	return err
}

func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}
