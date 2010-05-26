/**
 * Display a list of channels on the network.
 */
qwebirc.ui.ListPane = new Class({
  Implements: [Events],
  session: null,

  /* Store the list's current state. */
  loading: null,
  timestamp: 0,
  page: 1,
  pagetext: null,
  prev: null,
  next: null,
  chanbox: null,
  namefilter: "",
  topicfilter: "",

  initialize: function(session, parent) {
    this.session = session;

    var nameinput;
    var topicinput;

    /* Add back/forward buttons and page number. */
    this.prev = new Element("input", {"type": "submit", "value": "<- Prev Page", disabled: true});
    this.pagetext = document.createTextNode("Page 1 of 1");
    this.next = new Element("input", {"type": "submit", "value": "Next Page ->", disabled: true});
    parent.appendChild(this.prev);
    parent.appendChild(this.pagetext);
    parent.appendChild(this.next);

    /* Add refresh and update filters button. */
    var refresh = new Element("input", {"type": "submit", "value": "Refresh and Apply Filters"});
    refresh.addEvent("click", function(e) {
      (new Event(e)).stop();
      if (nameinput.value != this.namefilter || topicinput.value != this.topicfilter) {
        this.namefilter = nameinput.value;
        this.topicfilter = topicinput.value;
        this.page = 1;
      }
      this.timestamp = 0;
      this.update();
    }.bind(this));
    parent.appendChild(refresh);

    /* Add name filter text box. */
    parent.appendChild(document.createTextNode("Filter by Name:"));
    var nameinput = new Element("input");
    parent.appendChild(nameinput);
      
    /* Add topic filter box. */
    parent.appendChild(document.createTextNode("Filter by Topic:"));
    var topicinput = new Element("input");
    parent.appendChild(topicinput);
    
    /* Create the channel table. */
    var table = new Element("table");
    parent.appendChild(table);
    this.chanbox = new Element("tbody");
    table.appendChild(this.chanbox);
    
    /* Start the loading display timer. */
    var delayfn = function() { this.chanbox.set("html", "<tr><td class=\"loading\">Loading. . .</td></tr>"); }.bind(this);
    this.loading = delayfn.delay(500);

    /* Get a channel list. */
    this.update();
  },

  /**
   * Update the channel list.
   */
  update: function() {
    qwebirc.irc.AthemeQuery.channelList(function(channels, timestamp, total) {

      /* Update our timestamp to the timestamp of this list. */
      this.timestamp = timestamp;

      /* Update the page number. */
      var pages = Math.ceil(total/30);
      this.pagetext.nodeValue = "Page " + (this.page) + " of " + pages;

      /* Cancel any timeout. */
      if (this.loading != null) {
        clearTimeout(this.loading)
        this.loading = null;
      }

      /* Remove any previous content from the channel list box. */
      if (this.chanbox.hasChildNodes()) {
        while (this.chanbox.childNodes.length >= 1)
          this.chanbox.removeChild(this.chanbox.firstChild);
      }

      /* If we have a previous page, enable prev button. */
      if (this.page > 1) {
        this.prev.addEvent("click", function(e) {
          (new Event(e)).stop();
          this.page--;
          this.prev.removeEvents();
          this.update();
        }.bind(this));
        this.prev.removeProperty("disabled");
      }
      else {
        this.prev.setProperty("disabled", true);
        this.prev.removeEvents();
      }

      /* If we have a next page, enable next button. */
      if (this.page < pages) {
        this.next.addEvent("click", function(e) {
          (new Event(e)).stop();
          this.page++;
          this.next.removeEvents();
          this.update();
        }.bind(this));
        this.next.removeProperty("disabled");
      }
      else {
        this.next.setProperty("disabled", true);
        this.next.removeEvents();
      }

      /* If the connection failed, display that and return. */
      if (channels == null) {
        this.chanbox.set("html", "<tr><td class=\"loading\">Unable to load channel list, please try again later.</td></tr>");
        return;
      }

      /* Otherwise, print the channels. */ 
      for (var i = 0; i < channels.length; i++) {
        var channel = new Element("tr");

	var name = new Element("td");
        qwebirc.ui.Colourise(this.session, channels[i].name, name);
	channel.appendChild(name);

	var users = new Element("td");
	users.appendChild(document.createTextNode(channels[i].users));
	channel.appendChild(users);

	var topic = new Element("td");
        qwebirc.ui.Colourise(this.session, channels[i].topic, topic);
	channel.appendChild(topic);

	this.chanbox.appendChild(channel);
      }
    }.bind(this), this.timestamp, "30", this.page, this.namefilter, this.topicfilter);
  }
});
