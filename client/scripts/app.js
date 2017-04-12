var app = {
  server: 'http://parse.hrr.hackreactor.com/chatterbox/classes/messages',
  username: 'anonymous',
  roomName: 'lobby',
  messages: [],
  lastMessageId: 0,
  friends: {}
};

app.init = function() {
  //get username
  app.username = window.location.search.substr(10);
  //cache jQuery selectors
  app.$message = $('#message');
  app.$chats = $('#chats');
  app.$roomSelect = $('#roomSelect');
  app.$send = $('#send');

  //add listeners
  app.$send.on('submit', app.handleSubmit);
  app.$roomSelect.on('change', app.handleRoomChange);
  app.$chats.on('click', '.username', app.handleUsernameClick);

  //fetch previous messages
  app.fetch();

  setInterval(function() {
    app.fetch();
  }, 3000);
};

app.send = function(message) {
  console.log(message);
  $.ajax({
    // This is the url you should use to communicate with the parse API server.
    url: app.server,
    type: 'POST',
    data: JSON.stringify(message),
    contentType: 'application/json',
    success: function (data) {
      console.log('chatterbox: Message sent');
      //clear messages input
      app.$message.val('');
      //trigger fetch update
      app.fetch();
    },
    error: function (data) {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to send message', data);
    }
  });

};

app.fetch = function() {
  $.ajax({
    // This is the url you should use to communicate with the parse API server.
    url: this.server,
    type: 'GET',
    data: {order: '-createdAt'},
    success: function(data) {
      //dont do anything if we dont have anything to work with
      if (!data.results || !data.results.length) {return;}
      //store messages for caching later
      app.messages = data.results;
      //only update DOM if we have new message
      var mostRecentMessage = app.messages[app.messages.length - 1];
      if (mostRecentMessage.objectId !== app.lastMessageId) {
        app.renderRoomList(app.messages);
        app.renderMessages(app.messages);
      }
    },
    error: function (data) {
      // See: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to receive message', data);
    }
  });

};

app.renderMessages = function(messages) {

  //Clear old messages
  app.clearMessages();

  //Render each individual message
  messages
    .filter(function (message) {
      if (app.roomname === 'lobby' && !message.roomname) {
        return true;
      } else if (message.roomname === app.roomname) {
        return true;
      } else {
        return false;
      }
    })
    .forEach(app.renderMessage);
};

app.clearMessages = function() {
  app.$chats.html('');
};

app.renderMessage = function(message) {
  //create a div to hold the message
  var $chat = $('<div class="chat"/>');
  //add in the message data
  var $username = $('<span class="username">');
  $username
    .text(message.username + ': ')
    .attr('data-username', message.username)
    .appendTo($chat);

  if (app.friends[message.username] === true) {
    $username.addClass('friend');
  }

  var $message = $('<br><span>');
  $message.text(message.text).appendTo($chat);
  //Add the message to the UI
  app.$chats.append($chat);
};

app.handleSubmit = function(event) {
  var message = {
    username: app.username,
    text: app.$message.val(),
    roomname: app.roomname || 'lobby'
  };

  app.send(message);

  event.preventDefault();
};

app.renderRoomList = function(messages) {
  app.$roomSelect.html('<option value="__newRoom">New Room...</option></select>');
  if (messages) {
    var rooms = {};
    messages.forEach(function(message) {
      var roomname = message.roomname;
      if (roomname && !rooms[roomname]) {
        app.renderRoom(roomname);
        //we added this room already
        rooms[roomname] = true;
      }
    });
  }
};

app.renderRoom = function(roomname) {
  //to prevent crosssite by escaping with DOM methods
  var $option = $('<option/>').val(roomname).text(roomname);
  //this is to add to select
  app.$roomSelect.append($option);
};

app.handleRoomChange = function() {
  var selectIndex = app.$roomSelect.prop('selectedIndex');
  if (selectIndex === 0) {
    //create a new room
    var roomname = prompt('Enter room name');

    if (roomname) {
      app.roomname = roomname;
      app.renderRoom = (roomname);
      app.$roomSelect.val(roomname);
    }
  } else {
    //change to existing room
    app.roomname = app.$roomSelect.val();
  }
  app.renderMessage(app.messages);
};

app.handleUsernameClick = function (event) {
  var username = $(event.target).data('username');

  if (username !== undefined) {
    app.friends[username] = !app.friends[username];

    var selector = '[data-username="' + username.replace(/"/g, '\\\"' + '"]');
    var $usernames = $(selector).toggleClass('friend');
  }
};
