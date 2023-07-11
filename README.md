# Quote_Time
This web app shows quotes from famous people in the history.




Features:
- Users can register and log in via their user name and password
- The web app shows quote cards which contains quote, image, previous average rating, rating buttons, years
- Users can rate the quote, see the average of previous ratings
- Users can suggest new quotes and give feedback
- User will not see a quote again if he/she rated it before
- There is light and dark mode


To run it:
- [install](https://www.mongodb.com/docs/manual/administration/install-community/) mongodb and start it in your local machine
- run 'node prev/convert.js'
- run 'node app.js'
- go to 'localhost:3000/register' from your Google Chrome browser
- register to the service with a user name and password and then login with the same credentials


Technologies Used:
- Node.js, HTML, CSS, Bootstrap, jQuery are used for styling
- Express.js is used as a web application framework
- ejs is used for dynamic web page loading
- mongodb-community is used to store content and user data
- passport.js is used for secure user authentication
- bcrypt module is used for hashing and salting user passwords
