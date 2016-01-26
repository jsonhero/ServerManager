var host_queue = [];

var ServerBox = React.createClass({
  getInitialState: function() {
    return {data: {
      hostgroups: []
    }};
  },
  componentDidMount: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(err) {
        console.log(this.props.url, err);
      }.bind(this)
    });
  },
  render: function() {
    return (
      <div className='servers-comp'>
        <div className='servers-comp-wrapper'>
          <div className='servers-comp-header'>
            <h3> Servers </h3>
          </div>
          <ServerList data={this.state.data} />
          <div className='servers-comp-footer'>
            <span className='glyphicon glyphicon-plus'></span> Add Server
          </div>
        </div>
      </div>
    );
  }
});

var ServerList = React.createClass({
  clickHandler: function(e) {
    e.stopPropagation();
    $('#' + e.target.id).siblings('.serverlist-items').children().each(function(i, child) {
      var chi = $(child);
      var host = chi.data('hostid');
      var index = host_queue.indexOf(host);
      if (index != -1) {
      } else {
        host_queue.push(host);
        chi.addClass('active-item');
      }
    });
    console.log(host_queue);
  },
  clickRemove: function(e) {
    e.stopPropagation();
    $('.' + e.target.id).each(function(i, child) {
      var chi = $(child);
      var host = chi.data('hostid');
      var index = host_queue.indexOf(host);
      if (index != -1) {
        host_queue.splice(index, 1);
        chi.removeClass('active-item');
      }
    });
    console.log(host_queue);
  },
  render: function() {
    var serverNodes = this.props.data.hostgroups.map(function(server) {
      return(
        <div className='serverlist-category'>
          <div className='serverlist-header' id={server.name}  onClick={this.clickHandler}>
            {server.name}
            <span className='glyphicon glyphicon-remove category-remove' id={server.name} onClick={this.clickRemove}></span>
          </div>
          <ServerCategory key={server.name} data={server} />
        </div>
      );
    }.bind(this));

    return (
      <div className='servers-comp-serverlist'>
        {serverNodes}
      </div>
    );
  }

});

var ServerCategory = React.createClass({
  render: function() {
    var itemNodes = this.props.data.hosts.map(function(item) {
        return <ServerItem key={item.hostname} data={item} name={this.props.data.name}/>
    }.bind(this));

    return (
      <div className="serverlist-items">
        {itemNodes}
      </div>
    );
  }
});

var ServerItem = React.createClass({
  clickHandler: function(e) {
    var target = e.target;
    var host = target.dataset.hostid;
    var index = host_queue.indexOf(host);
    if (index != -1) {
      host_queue.splice(index, 1);
      target.classList.remove('active-item');
    } else {
      host_queue.push(host);
      target.classList.add('active-item');
    }
    console.log(host_queue);
  },
  render: function() {
    var datclass = 'serverlist-item ' + this.props.name;
    return(
      <div data-hostid={this.props.data.hostname} className={datclass} onClick={this.clickHandler}>
        {this.props.data.hostname}
      </div>
    )
  }
});

ReactDOM.render(
  <ServerBox url='/api/hosts' />,
  document.getElementById('servers')
)
