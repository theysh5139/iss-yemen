<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Events - ISS YEMEN</title>
    <style>
        :root { --sidebar-bg:#1e604f; --text-color:#333; --light-gray:#f4f4f4; --border-color:#ccc; --main-bg:#fff; --accent-green:#28a745; }
        body { font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin:0; padding:0; background:var(--light-gray); display:flex; }
        .sidebar { width:250px; background:var(--sidebar-bg); color:#fff; height:100vh; display:flex; flex-direction:column; padding-top:20px; box-shadow:2px 0 5px rgba(0,0,0,.1); position:fixed; left:0; }
        .logo { padding:0 20px 20px; font-size:1.2em; font-weight:700; border-bottom:1px solid rgba(255,255,255,.1); }
        .menu a { display:block; padding:12px 20px; text-decoration:none; color:#ccc; transition:background-color .3s; }
        .menu a:hover { background-color:rgba(255,255,255,.1); color:#fff; }
        .menu .submenu-toggle { display:flex; justify-content:space-between; align-items:center; }
        .menu .active-section { background:#0d4336; color:#fff; font-weight:700; }
        .menu .active-page { background:#0f4f3e; color:#fff; padding-left:30px; }
        .admin-info { margin-top:auto; padding:15px; display:flex; align-items:center; border-top:1px solid rgba(255,255,255,.1); }
        .admin-info img { width:30px; height:30px; border-radius:50%; margin-right:10px; background:#fff; }
        .main-content { margin-left:250px; flex-grow:1; background:var(--main-bg); min-height:100vh; padding:20px; box-sizing:border-box; }
        .top-nav { display:flex; justify-content:space-between; align-items:center; padding-bottom:15px; border-bottom:1px solid var(--border-color); margin-bottom:20px; }
        .breadcrumb a { text-decoration:none; color:#666; font-size:.9em; }
        .breadcrumb span { color:var(--accent-green); font-weight:700; }
        h1 { font-size:1.8em; color:var(--text-color); margin:0; padding-bottom:20px; }
        .section { background:#fff; border:1px solid var(--border-color); border-radius:6px; padding:16px; margin-bottom:16px; }
        .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px,1fr)); gap:16px; }
        .card-link { display:block; text-decoration:none; color:var(--text-color); border:1px solid var(--border-color); border-radius:6px; padding:14px; background:#fff; transition:box-shadow .2s, transform .05s; }
        .card-link:hover { box-shadow:0 4px 10px rgba(0,0,0,.08); transform:translateY(-1px); }
        .card-link h3 { margin:0 0 6px 0; font-size:1.05em; }
        .muted { color:#666; font-size:.92em; }
    </style>
    </head>
    <body>

    <div class="sidebar">
        <div class="logo">ISS YEMEN</div>
        <div class="menu">
            <a href="dashboard.php">Dashboard</a>
            <a href="manage_events.php" class="active-section submenu-toggle">Manage Events</a>
            <a href="add_event.html" class="active-page">Add Events</a>
            <a href="manage_members.php" class="submenu-toggle">Manage Members</a>
            <a href="news_announcements.php" class="submenu-toggle">News & Announcements</a>
            <a href="settings_help.php" class="submenu-toggle">Settings & Help</a>
        </div>
        <div class="admin-info">
            <img src="avatar.png" alt="Admin Avatar">
            <span>Admin <br> admin@graduate.utm.my</span>
        </div>
    </div>

    <div class="main-content">
        <div class="top-nav">
            <div class="breadcrumb">
                <a href="dashboard.php">Dashboard</a> &gt;
                <span>Manage Events</span>
            </div>
            <div class="user-actions">
                <span style="font-size:1.5em; margin-right:15px;">&#x1F514;</span>
                <span style="font-size:1.5em;">&#x2699;</span>
            </div>
        </div>

        <h1>Manage Events</h1>

        <section class="section">
            <div class="grid">
                <a class="card-link" href="add_event.html">
                    <h3>Add Events</h3>
                    <div class="muted">Create a new event and publish details.</div>
                </a>
                <a class="card-link" href="#" onclick="alert('Coming soon: Event list & edit page.')">
                    <h3>View / Edit Events</h3>
                    <div class="muted">Browse, edit, or cancel existing events.</div>
                </a>
            </div>
        </section>
    </div>

    </body>
    </html>






