# Rigby

A modern community platform built with vanilla HTML, CSS, and JavaScript — powered by Supabase and deployed on Vercel.

## Live Site

https://rigby-six.vercel.app

## Features

- Register, login, logout with email verification
- Create, view, and delete posts
- Comment on posts, delete own comments
- Like and unlike posts
- File downloads — admins upload, members download
- Admin dashboard — manage users, posts, comments
- Profile page with bio editing
- Dark mode (persists across sessions)
- Mobile-responsive with hamburger nav
- Search/filter posts live

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML + CSS + JavaScript |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Hosting | Vercel |
| Version Control | GitHub |
| Dev Environment | Termux on Android |

## Project Structure
rigby/
├── index.html        Homepage + feed
├── login.html        Login page
├── register.html     Register page
├── post.html         Single post + comments
├── profile.html      User profile + bio
├── downloads.html    File downloads
├── admin.html        Admin dashboard
├── css/
│   ├── main.css      Design system + dark mode
│   ├── auth.css      Auth page styles
│   └── components.css Post cards + UI components
├── js/
│   ├── supabase.js   Supabase client
│   ├── auth.js       Auth + session + toasts + theme
│   ├── posts.js      Feed + post creation + likes
│   ├── comments.js   Post view + comments
│   ├── downloads.js  File upload/download
│   ├── profile.js    Profile view + bio edit
│   └── admin.js      Admin dashboard
└── vercel.json       Routing config
## Roles

| Role | Permissions |
|------|-------------|
| Guest | View posts, comments, file list |
| Member | + Create posts, comment, like, download files |
| Admin | + Upload/delete files, delete any post/comment, manage users |

## Local Development

No build tools needed. Open any HTML file directly or use a local server:
Releases
Version
Description
v0.1.0
Project setup
v0.2.0
Authentication
v0.3.0
Posts, comments, likes
v0.4.0
File downloads
v0.5.0
Admin dashboard
v0.6.0
Profile page, mobile nav, spinners
v1.0.0
Search, toasts, final polish

#FYI, I DID IT ALL ON TERMUX
