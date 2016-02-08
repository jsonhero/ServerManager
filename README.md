# Server Manager

*Example Video*

<a data-flickr-embed="true"  href="https://www.flickr.com/photos/139086823@N02/24865767606/in/dateposted-public/" title="Server Manager Example"><img src="https://farm2.staticflickr.com/1471/24865767606_3e315794d0_b.jpg" width="560" height="300" border="10" alt="Server Manager Example"></a>

I created this project to help with development work flow on distrubuted server systems. In it's current state it's pretty biased towards my own system for MineSwine, but I intend to make it more agile.

This is one of my largest personal projects to date. As the project got larger and larger, I quickly learned the evils of project entropy and what to do on future projects to avoid it. In the near future I hope to recode a lot of the SSH action execution system to be a lot more modularized and clean cut as well as the rest of the API.

This was the also the first time I've used ReactJS, which I now feel like I have firm understanding of after diving head first into it. It's now my favorite frontend framework! Some of the ReactJS code is a little messy and scattered, but I'm pretty proud of it for being my first ReactJS project. 

# Current Features
- Variety of automated server actions such as, BASH commands, FTP, SSH, file/folder version upkeep, etc.
- Custom Server scripts with a configurable list of actions
- Server Management page for adding/removing servers
- Individual Server History Logging
- Live Server Status Tracker (Biased page for pulling data from our MySQL server)


# Planned Future Features
- Complete recode of SSH system to allow for a more agile environment.
- Live interactive BASH terminal view for servers.
- Custom action creator.
- MySQL cache for server status page.

# Tech Used
- Moment.js
- Node.js
- Express.js
- Javascript
- ReactJS
- LESS
- MySQL
- MongoDB
- PassportJS
- Handlebars
- SSH
