/*******************************/
/***** BEGIN OF UBOTCARE ******/
/*****************************/


(function() {
  var slice = [].slice;

  this.UbotCare = {
    INTERNAL: {
      "open": true,
      "heightChecked": false,
      "initHeight": 0,
      "intval": null,
      "jwt": "",
      "appSlug": "none",
      "liveChatId": "ubotcare__live_chat",
      "refreshTime": 4000,
    },
    setAppSlug: function(appSlug) {
      this.INTERNAL.appSlug = appSlug;
      this.jwt();
    },
    getSlugApp: function() {
      return this.INTERNAL.appSlug;
    },
    setLiveChatId: function(liveChatId) {
      this.INTERNAL.liveChatId = liveChatId;
    },
    getLiveChatId: function() {
      return this.INTERNAL.liveChatId;
    },
    setRefreshTime(refreshTime) {
      this.INTERNAL.refreshTime = refreshTime;
    },
    refreshTime() {
      return this.INTERNAL.refreshTime;
    },
    new: function(appSlug) {
      this.INTERNAL.appSlug = appSlug;
      this.INTERNAL.jwt = this.jwt();
      messages = localStorage.getItem('ubotcare__messages');
      if (!messages || messages.length <= 0)
        localStorage.setItem('ubotcare__messages', JSON.stringify({"messages": []}));
      return this;
    },
    slideToggleById: function(id) {
      var INTERNAL = this.INTERNAL;
      var mdiv = document.getElementById(id);
      if (!INTERNAL.heightChecked) {
        INTERNAL.initHeight = mdiv.offsetHeight;
        INTERNAL.heightChecked = true;
      }
      if (INTERNAL.open) {
        var h = INTERNAL.initHeight;
        INTERNAL.open = false;
        INTERNAL.intval = setInterval(function(){
          h-=2;
          mdiv.style.height = h + 'px';
          if(h <= 45) { 
            window.clearInterval(INTERNAL.intval);
            this.INTERNAL = INTERNAL;
          }
          }, 1
        );
      }
      else {
        var h = 0;
        INTERNAL.open = true;
        INTERNAL.intval = setInterval(function(){
          h+=2;
          mdiv.style.height = h + 'px';
          if(h >= INTERNAL.initHeight) {
            window.clearInterval(INTERNAL.intval);
            this.INTERNAL = INTERNAL;
          }
        }, 1
        );
      }
    },
    jwt: function() {
      jwt = localStorage.getItem('ubotcare__jwt');
      if (!jwt || jwt.length <= 0) {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        token =  s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
      }
      else {
        token = JSON.parse(jwt).token
      }
      jwt = {token: token, appSlug: this.INTERNAL.appSlug}
      this.INTERNAL.jwt = jwt;
      localStorage.setItem('ubotcare__jwt', JSON.stringify(jwt));
      return jwt;
    },
    generateTchat: function() {
      var tchat = document.getElementById(this.INTERNAL.liveChatId);

      var frag = document.createRange().createContextualFragment('<div id="ubotcare__chatcontainer"><header onclick="ubotcare__reduceChat()" class="ubotcare__header clearfix"><a class="ubotcare__chat-close" onclick="ubotcare__closeChat()">x</a><h4>UbotCare</h4></header><div class="chat"><div id="ubotcare__chat-history" class="chat-history"></div><form action="#" onsubmit="ubotcare__sendMessageToUbotcare(event)"><fieldset><input type="text" id="ubotcare__inputMessage" placeholder="Type your message…" autofocus=true><button class="btn small purple">Send</button></fieldset></form></div></div>');
      tchat.append(frag);
      return false;
    },
    generateMessages: function(messages) {
      var doms = "";
      if (!messages || messages.length <= 0 || !messages["messages"] || messages["messages"].length <= 0) return;
      var prevIsUser = !messages["messages"][0].is_user;
      var you = "";
      messages["messages"].forEach(function(message) {
        doms += "<div class='chat-message clearfix'>"
        if (prevIsUser != message.is_user) {
          prevIsUser = message.is_user;
          if (message.is_user === true) {
            doms += '<img src="https://tsc-weshare-dev.s3.eu-west-1.amazonaws.com/uploads/1556196003-fbcde9be5bbc2b7c15b4789542d1a4ae/user-icon.png" alt="" width="32" height="32">'
            you = "<h5>You</h5>"
          }
          else {
            doms += '<img src="https://tsc-weshare-dev.s3.eu-west-1.amazonaws.com/uploads/1556636123-0e6438a6a36da8d6191426fa96e3e66f/favicon.jpg" alt="" width="32" height="32">'
            you = "<h5>UbotCare</h5>"
          }
          doms += '<div class="chat-message-content clearfix">' + you;
        }
        else {
          doms += '<div class="chat-message-content clearfix">';
        }
        if (message.content_type === "text") {
          doms += "<p>" + message.response + "</p>"
        }
        else if (message.content_type === "image") {
          doms += "<img src=" + message.response + " class='img-msg'>"
        }
        doms += '</div></div>'
      });
      doms += '</div>'
      var frag = document.createRange().createContextualFragment(doms);
      var history =  document.getElementById('ubotcare__chat-history')
      history.innerHTML = "";
      history.append(frag);
      history.scrollTop = history.scrollHeight;
    },
    getMessages: function() {
      messages = localStorage.getItem('ubotcare__messages');
      if (messages && messages.length > 0)
        return (JSON.parse(messages));
      else
        return "";
    },
    start: function() {

      window.App = {}
      window.App.cable = ActionCable.createConsumer("wss://sly-tscdevelopers.pagekite.me/cable");
      window.App.liveChatChannel = window.App.cable.subscriptions.create({channel: "LiveChatChannel", jwt: ubotcare.jwt()}, {
        // ActionCable callbacks
        connected: function() {
          console.log("connected");
        },
        disconnected: function() {
          console.log("disconnected")
        },
        rejected: function() {
          console.log("rejected")
        },
        received: function(messagesData) {
          console.log("receive datas:")
          messages = ubotcare.getMessages();
          newMessages = {};
          newMessages.messages = (messages.messages).concat(messagesData.message);
          localStorage.setItem('ubotcare__messages', deserialize(newMessages));
        },
        /*******************************/
        /******* CUSTOM METHODS *******/
        /*****************************/
        send_live_messages: function(message) {
          this.perform("send_live_messages", {data: message});
        }
      });
    },
    appendUserMessage: function(message) {
      messages = ubotcare.getMessages();
      newMessages = {};
      newMessages.messages = (messages.messages).concat([{is_user: true, response: message, content_type: "text"}]);
      localStorage.setItem('ubotcare__messages', deserialize(newMessages));
      this.generateMessages();
    }
  };

}).call(this);

/*******************************/
/*****   END OF UBOTCARE  *****/
/*****************************/

ubotcare = UbotCare.new("");

/*******************************/
/**** BEGIN OF ACTIONCABLE ****/
/*****************************/

(function() {
  var slice = [].slice;

  this.ActionCable = {
    INTERNAL: {
      "message_types": {
        "welcome": "welcome",
        "ping": "ping",
        "confirmation": "confirm_subscription",
        "rejection": "reject_subscription"
      },
      "default_mount_path": "/cable",
      "protocols": ["actioncable-v1-json", "actioncable-unsupported"]
    },
    createConsumer: function(url) {
      var ref;
      if (url == null) {
        url = (ref = this.getConfig("url")) != null ? ref : this.INTERNAL.default_mount_path;
      }
      return new ActionCable.Consumer(this.createWebSocketURL(url));
    },
    getConfig: function(name) {
      var element;
      element = document.head.querySelector("meta[name='action-cable-" + name + "']");
      return element != null ? element.getAttribute("content") : void 0;
    },
    createWebSocketURL: function(url) {
      var a;
      if (url && !/^wss?:/i.test(url)) {
        a = document.createElement("a");
        a.href = url;
        a.href = a.href;
        a.protocol = a.protocol.replace("http", "ws");
        return a.href;
      } else {
        return url;
      }
    },
    startDebugging: function() {
      return this.debugging = true;
    },
    stopDebugging: function() {
      return this.debugging = null;
    },
    log: function() {
      var messages;
      messages = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (this.debugging) {
        messages.push(Date.now());
        return console.log.apply(console, ["[ActionCable]"].concat(slice.call(messages)));
      }
    }
  };

}).call(this);
(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ActionCable.ConnectionMonitor = (function() {
    var clamp, now, secondsSince;

    ConnectionMonitor.pollInterval = {
      min: 3,
      max: 30
    };

    ConnectionMonitor.staleThreshold = 6;

    function ConnectionMonitor(connection) {
      this.connection = connection;
      this.visibilityDidChange = bind(this.visibilityDidChange, this);
      this.reconnectAttempts = 0;
    }

    ConnectionMonitor.prototype.start = function() {
      if (!this.isRunning()) {
        this.startedAt = now();
        delete this.stoppedAt;
        this.startPolling();
        document.addEventListener("visibilitychange", this.visibilityDidChange);
        return ActionCable.log("ConnectionMonitor started. pollInterval = " + (this.getPollInterval()) + " ms");
      }
    };

    ConnectionMonitor.prototype.stop = function() {
      if (this.isRunning()) {
        this.stoppedAt = now();
        this.stopPolling();
        document.removeEventListener("visibilitychange", this.visibilityDidChange);
        return ActionCable.log("ConnectionMonitor stopped");
      }
    };

    ConnectionMonitor.prototype.isRunning = function() {
      return (this.startedAt != null) && (this.stoppedAt == null);
    };

    ConnectionMonitor.prototype.recordPing = function() {
      return this.pingedAt = now();
    };

    ConnectionMonitor.prototype.recordConnect = function() {
      this.reconnectAttempts = 0;
      this.recordPing();
      delete this.disconnectedAt;
      return ActionCable.log("ConnectionMonitor recorded connect");
    };

    ConnectionMonitor.prototype.recordDisconnect = function() {
      this.disconnectedAt = now();
      return ActionCable.log("ConnectionMonitor recorded disconnect");
    };

    ConnectionMonitor.prototype.startPolling = function() {
      this.stopPolling();
      return this.poll();
    };

    ConnectionMonitor.prototype.stopPolling = function() {
      return clearTimeout(this.pollTimeout);
    };

    ConnectionMonitor.prototype.poll = function() {
      return this.pollTimeout = setTimeout((function(_this) {
        return function() {
          _this.reconnectIfStale();
          return _this.poll();
        };
      })(this), this.getPollInterval());
    };

    ConnectionMonitor.prototype.getPollInterval = function() {
      var interval, max, min, ref;
      ref = this.constructor.pollInterval, min = ref.min, max = ref.max;
      interval = 5 * Math.log(this.reconnectAttempts + 1);
      return Math.round(clamp(interval, min, max) * 1000);
    };

    ConnectionMonitor.prototype.reconnectIfStale = function() {
      if (this.connectionIsStale()) {
        ActionCable.log("ConnectionMonitor detected stale connection. reconnectAttempts = " + this.reconnectAttempts + ", pollInterval = " + (this.getPollInterval()) + " ms, time disconnected = " + (secondsSince(this.disconnectedAt)) + " s, stale threshold = " + this.constructor.staleThreshold + " s");
        this.reconnectAttempts++;
        if (this.disconnectedRecently()) {
          return ActionCable.log("ConnectionMonitor skipping reopening recent disconnect");
        } else {
          ActionCable.log("ConnectionMonitor reopening");
          return this.connection.reopen();
        }
      }
    };

    ConnectionMonitor.prototype.connectionIsStale = function() {
      var ref;
      return secondsSince((ref = this.pingedAt) != null ? ref : this.startedAt) > this.constructor.staleThreshold;
    };

    ConnectionMonitor.prototype.disconnectedRecently = function() {
      return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.constructor.staleThreshold;
    };

    ConnectionMonitor.prototype.visibilityDidChange = function() {
      if (document.visibilityState === "visible") {
        return setTimeout((function(_this) {
          return function() {
            if (_this.connectionIsStale() || !_this.connection.isOpen()) {
              ActionCable.log("ConnectionMonitor reopening stale connection on visibilitychange. visbilityState = " + document.visibilityState);
              return _this.connection.reopen();
            }
          };
        })(this), 200);
      }
    };

    now = function() {
      return new Date().getTime();
    };

    secondsSince = function(time) {
      return (now() - time) / 1000;
    };

    clamp = function(number, min, max) {
      return Math.max(min, Math.min(max, number));
    };

    return ConnectionMonitor;

  })();

}).call(this);
(function() {
  var i, message_types, protocols, ref, supportedProtocols, unsupportedProtocol,
    slice = [].slice,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = ActionCable.INTERNAL, message_types = ref.message_types, protocols = ref.protocols;

  supportedProtocols = 2 <= protocols.length ? slice.call(protocols, 0, i = protocols.length - 1) : (i = 0, []), unsupportedProtocol = protocols[i++];

  ActionCable.Connection = (function() {
    Connection.reopenDelay = 500;

    function Connection(consumer) {
      this.consumer = consumer;
      this.open = bind(this.open, this);
      this.subscriptions = this.consumer.subscriptions;
      this.monitor = new ActionCable.ConnectionMonitor(this);
      this.disconnected = true;
    }

    Connection.prototype.send = function(data) {
      if (this.isOpen()) {
        this.webSocket.send(JSON.stringify(data));
        return true;
      } else {
        return false;
      }
    };

    Connection.prototype.open = function() {
      if (this.isActive()) {
        ActionCable.log("Attempted to open WebSocket, but existing socket is " + (this.getState()));
        throw new Error("Existing connection must be closed before opening");
      } else {
        ActionCable.log("Opening WebSocket, current state is " + (this.getState()) + ", subprotocols: " + protocols);
        if (this.webSocket != null) {
          this.uninstallEventHandlers();
        }
        this.webSocket = new WebSocket(this.consumer.url, protocols);
        this.installEventHandlers();
        this.monitor.start();
        return true;
      }
    };

    Connection.prototype.close = function(arg) {
      var allowReconnect, ref1;
      allowReconnect = (arg != null ? arg : {
        allowReconnect: true
      }).allowReconnect;
      if (!allowReconnect) {
        this.monitor.stop();
      }
      if (this.isActive()) {
        return (ref1 = this.webSocket) != null ? ref1.close() : void 0;
      }
    };

    Connection.prototype.reopen = function() {
      var error, error1;
      ActionCable.log("Reopening WebSocket, current state is " + (this.getState()));
      if (this.isActive()) {
        try {
          return this.close();
        } catch (error1) {
          error = error1;
          return ActionCable.log("Failed to reopen WebSocket", error);
        } finally {
          ActionCable.log("Reopening WebSocket in " + this.constructor.reopenDelay + "ms");
          setTimeout(this.open, this.constructor.reopenDelay);
        }
      } else {
        return this.open();
      }
    };

    Connection.prototype.getProtocol = function() {
      var ref1;
      return (ref1 = this.webSocket) != null ? ref1.protocol : void 0;
    };

    Connection.prototype.isOpen = function() {
      return this.isState("open");
    };

    Connection.prototype.isActive = function() {
      return this.isState("open", "connecting");
    };

    Connection.prototype.isProtocolSupported = function() {
      var ref1;
      return ref1 = this.getProtocol(), indexOf.call(supportedProtocols, ref1) >= 0;
    };

    Connection.prototype.isState = function() {
      var ref1, states;
      states = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return ref1 = this.getState(), indexOf.call(states, ref1) >= 0;
    };

    Connection.prototype.getState = function() {
      var ref1, state, value;
      for (state in WebSocket) {
        value = WebSocket[state];
        if (value === ((ref1 = this.webSocket) != null ? ref1.readyState : void 0)) {
          return state.toLowerCase();
        }
      }
      return null;
    };

    Connection.prototype.installEventHandlers = function() {
      var eventName, handler;
      for (eventName in this.events) {
        handler = this.events[eventName].bind(this);
        this.webSocket["on" + eventName] = handler;
      }
    };

    Connection.prototype.uninstallEventHandlers = function() {
      var eventName;
      for (eventName in this.events) {
        this.webSocket["on" + eventName] = function() {};
      }
    };

    Connection.prototype.events = {
      message: function(event) {
        var identifier, message, ref1, type;
        if (!this.isProtocolSupported()) {
          return;
        }
        ref1 = JSON.parse(event.data), identifier = ref1.identifier, message = ref1.message, type = ref1.type;
        switch (type) {
          case message_types.welcome:
            this.monitor.recordConnect();
            return this.subscriptions.reload();
          case message_types.ping:
            return this.monitor.recordPing();
          case message_types.confirmation:
            return this.subscriptions.notify(identifier, "connected");
          case message_types.rejection:
            return this.subscriptions.reject(identifier);
          default:
            return this.subscriptions.notify(identifier, "received", message);
        }
      },
      open: function() {
        ActionCable.log("WebSocket onopen event, using '" + (this.getProtocol()) + "' subprotocol");
        this.disconnected = false;
        if (!this.isProtocolSupported()) {
          ActionCable.log("Protocol is unsupported. Stopping monitor and disconnecting.");
          return this.close({
            allowReconnect: false
          });
        }
      },
      close: function(event) {
        ActionCable.log("WebSocket onclose event");
        if (this.disconnected) {
          return;
        }
        this.disconnected = true;
        this.monitor.recordDisconnect();
        return this.subscriptions.notifyAll("disconnected", {
          willAttemptReconnect: this.monitor.isRunning()
        });
      },
      error: function() {
        return ActionCable.log("WebSocket onerror event");
      }
    };

    return Connection;

  })();

}).call(this);
(function() {
  var slice = [].slice;

  ActionCable.Subscriptions = (function() {
    function Subscriptions(consumer) {
      this.consumer = consumer;
      this.subscriptions = [];
    }

    Subscriptions.prototype.create = function(channelName, mixin) {
      var channel, params, subscription;
      channel = channelName;
      params = typeof channel === "object" ? channel : {
        channel: channel
      };
      subscription = new ActionCable.Subscription(this.consumer, params, mixin);
      return this.add(subscription);
    };

    Subscriptions.prototype.add = function(subscription) {
      this.subscriptions.push(subscription);
      this.consumer.ensureActiveConnection();
      this.notify(subscription, "initialized");
      this.sendCommand(subscription, "subscribe");
      return subscription;
    };

    Subscriptions.prototype.remove = function(subscription) {
      this.forget(subscription);
      if (!this.findAll(subscription.identifier).length) {
        this.sendCommand(subscription, "unsubscribe");
      }
      return subscription;
    };

    Subscriptions.prototype.reject = function(identifier) {
      var i, len, ref, results, subscription;
      ref = this.findAll(identifier);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        subscription = ref[i];
        this.forget(subscription);
        this.notify(subscription, "rejected");
        results.push(subscription);
      }
      return results;
    };

    Subscriptions.prototype.forget = function(subscription) {
      var s;
      this.subscriptions = (function() {
        var i, len, ref, results;
        ref = this.subscriptions;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          s = ref[i];
          if (s !== subscription) {
            results.push(s);
          }
        }
        return results;
      }).call(this);
      return subscription;
    };

    Subscriptions.prototype.findAll = function(identifier) {
      var i, len, ref, results, s;
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        s = ref[i];
        if (s.identifier === identifier) {
          results.push(s);
        }
      }
      return results;
    };

    Subscriptions.prototype.reload = function() {
      var i, len, ref, results, subscription;
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        subscription = ref[i];
        results.push(this.sendCommand(subscription, "subscribe"));
      }
      return results;
    };

    Subscriptions.prototype.notifyAll = function() {
      var args, callbackName, i, len, ref, results, subscription;
      callbackName = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      ref = this.subscriptions;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        subscription = ref[i];
        results.push(this.notify.apply(this, [subscription, callbackName].concat(slice.call(args))));
      }
      return results;
    };

    Subscriptions.prototype.notify = function() {
      var args, callbackName, i, len, results, subscription, subscriptions;
      subscription = arguments[0], callbackName = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      if (typeof subscription === "string") {
        subscriptions = this.findAll(subscription);
      } else {
        subscriptions = [subscription];
      }
      results = [];
      for (i = 0, len = subscriptions.length; i < len; i++) {
        subscription = subscriptions[i];
        results.push(typeof subscription[callbackName] === "function" ? subscription[callbackName].apply(subscription, args) : void 0);
      }
      return results;
    };

    Subscriptions.prototype.sendCommand = function(subscription, command) {
      var identifier;
      identifier = subscription.identifier;
      return this.consumer.send({
        command: command,
        identifier: identifier
      });
    };

    return Subscriptions;

  })();

}).call(this);
(function() {
  ActionCable.Subscription = (function() {
    var extend;

    function Subscription(consumer, params, mixin) {
      this.consumer = consumer;
      if (params == null) {
        params = {};
      }
      this.identifier = JSON.stringify(params);
      extend(this, mixin);
    }

    Subscription.prototype.perform = function(action, data) {
      if (data == null) {
        data = {};
      }
      data.action = action;
      return this.send(data);
    };

    Subscription.prototype.send = function(data) {
      return this.consumer.send({
        command: "message",
        identifier: this.identifier,
        data: JSON.stringify(data)
      });
    };

    Subscription.prototype.unsubscribe = function() {
      return this.consumer.subscriptions.remove(this);
    };

    extend = function(object, properties) {
      var key, value;
      if (properties != null) {
        for (key in properties) {
          value = properties[key];
          object[key] = value;
        }
      }
      return object;
    };

    return Subscription;

  })();

}).call(this);
(function() {
  ActionCable.Consumer = (function() {
    function Consumer(url) {
      this.url = url;
      this.subscriptions = new ActionCable.Subscriptions(this);
      this.connection = new ActionCable.Connection(this);
    }

    Consumer.prototype.send = function(data) {
      return this.connection.send(data);
    };

    Consumer.prototype.connect = function() {
      return this.connection.open();
    };

    Consumer.prototype.disconnect = function() {
      return this.connection.close({
        allowReconnect: false
      });
    };

    Consumer.prototype.ensureActiveConnection = function() {
      if (!this.connection.isActive()) {
        return this.connection.open();
      }
    };

    return Consumer;

  })();

}).call(this);

function ubotcare__sendMessageToUbotcare(event) {
  event.preventDefault();
  messageToSend = document.getElementById('ubotcare__inputMessage').value;  
  messageToSend = messageToSend.trim();
  if (messageToSend.length <= 0) return;
  window.App.liveChatChannel.send_live_messages(messageToSend);
  ubotcare.appendUserMessage(messageToSend);
  document.getElementById('ubotcare__inputMessage').value = "";
}

function deserialize(data) {
  return JSON.stringify(data)
}

function ubotcare__reduceChat() {
  ubotcare.slideToggleById(ubotcare.getLiveChatId());
}

function ubotcare__closeChat() {
  document.getElementById(ubotcare.getLiveChatId()).style.display = 'none';
}

/*******************************/
/***** END OF ACTIONCABLE *****/
/*****************************/


document.addEventListener('DOMContentLoaded', function(event) {
  messages = ubotcare.getMessages();
  ubotcare.generateTchat(messages);
  ubotcare.generateMessages(messages);
    setInterval(function(){
      messages = ubotcare.getMessages();
      ubotcare.generateMessages(messages);
    },
  ubotcare.refreshTime() );
})

// client mockup
ubotcare.setAppSlug("pri");
ubotcare.setLiveChatId("ubotcare__live_chat");
ubotcare.setRefreshTime(4000);
ubotcare.start();