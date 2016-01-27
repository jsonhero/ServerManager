var host_queue = [];

//************************* MAIN PAGE **************************

var ServerBox = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        data = this.sortGroups(data);
        this.setState({data: data});
      }.bind(this),
      error: function(err) {
        console.log(this.props.url, err);
      }.bind(this)
    });
  },
  sortGroups: function(hosts) {
    var hostgroups = [];
    var groups = {};
    hosts.hosts.forEach(function(host) {
      var group = host.hostgroup;
      if (!groups[group]) {
        groups[group] = {
          hosts: [host],
          name: group
        }
      } else {
        groups[group].hosts.push(host);
      }
    });
    var keys = Object.keys(groups);
    keys.forEach(function(key) {
      hostgroups.push(groups[key]);
    });
    return hostgroups;
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
  },
  render: function() {
    var serverNodes = this.props.data.map(function(server) {
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


//************************* MANAGER PAGE **************************

var ManagerBox = React.createClass({
  getInitialState: function() {
    return {data: {
      hosts: []
    }};
  },
  managerSubmit: function(host) {
    var hosts = this.state.data.hosts;
    var newHosts = hosts.concat([host])
    this.setState({ data: {
      hosts: newHosts
    }});

    $.ajax({
      url: '/api/hosts',
      type: 'POST',
      dataType: 'json',
      data: host,
      success: function() {
      },
      error: function() {
      }
    });
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
      <div className='server-manager'>
        <ManagerForm onManagerSubmit={this.managerSubmit} />
        <table className='table table-striped'>
          <thead>
            <tr>
              <th>IP</th>
              <th>Hostname</th>
              <th>Host Group</th>
              <th>Edit</th>
            </tr>
          </thead>
          <TableList data={this.state.data} />
        </table>
      </div>
    );
  }
});

var ManagerForm = React.createClass({
  getInitialState: function() {
    return {hostname: '', hostgroup: '', host: ''};
  },
  handleHostChange: function(e) {
    this.setState({hostname: e.target.value});
  },
  handleGroupChange: function(e) {
    this.setState({hostgroup: e.target.value});
  },
  handleIPChange: function(e) {
    this.setState({host: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var host = this.state.hostname.trim();
    var group = this.state.hostgroup.trim();
    var ip = this.state.host.trim();

    if (!host || !group || !ip) {
      return;
    }
    this.props.onManagerSubmit({hostname: host, hostgroup: group, host: ip});
    this.setState({hostname: '', hostgroup: '', host: ''});
  },
  render: function() {
    return (
      <form className="managerForm" onSubmit={this.handleSubmit}>
        <div className='FormLabel'>Host Name: </div>
        <input className='form-control' value={this.state.hostname} onChange={this.handleHostChange} type="text" placeholder="Host name..." />
        <div className='FormLabel'>Host Group: </div>
        <input className='form-control' value={this.state.hostgroup} onChange={this.handleGroupChange} type="text" placeholder="Host group..." />
        <div className='FormLabel'>Server IP: </div>
        <input className='form-control' value={this.state.host} type="text" onChange={this.handleIPChange} placeholder="Host IP..." />
        <input id='manager-submit' className='form-control' type="submit" value="Submit" />
      </form>
    );
  }
});


var TableList = React.createClass({
  render: function() {
    var nodes = this.props.data.hosts.map(function(host) {
      return (
        <TableRow key={host.hostname} data={host} />
      );
    });

    return (
      <tbody>
        {nodes}
      </tbody>
    );
  }
});

var TableRow = React.createClass({
  handleRemove: function(e) {
    var id = e.target.dataset.id;
    var ele = document.getElementById(id);
    ele.remove();
    $.ajax({
      url: '/api/hosts',
      type: 'DELETE',
      data: {hostname: id},
      dataType: 'json',
      success: function() {
      },
      error: function() {
      }
    });
  },
  render: function() {
    return (
      <tr id={this.props.data.hostname}>
        <td>
          {this.props.data.host}
        </td>
        <td>
          {this.props.data.hostname}
        </td>
        <td>
          {this.props.data.hostgroup}
        </td>
        <td>
          <button onClick={this.handleRemove} data-id={this.props.data.hostname} className="btn btn-danger">Delete</button>
        </td>
      </tr>
    );
  }
});

//************************* ACTION MODEL **************************

var ActionBox = React.createClass({
  getInitialState: function() {
    return {data: {}, url: ''};
  },
  setParentState: function(url, data) {
    this.setState({data: data, url: url});
  },
  render: function() {
    return (
    <div className='components'>
      <div className='component-header'>
        <div className='component-name'>
          Execute Command
        </div>
      </div>
      <div className='component-body'>
        <div className='comp-body-wrap'>
          <ActionBody data={this.state.data} setParentState={this.setParentState}/>
        </div>
      </div>
      <div className='component-footer'>
        <ActionFooter setParentState={this.setParentState} data={this.state} />
      </div>
    </div>
  );
  }
});

var ActionBody = React.createClass({
  getInitialState: function() {
    return {url: '/api/action/command/', data: { command: ''}};
  },
  handleCommandChange: function(e) {
    var command = e.target.value;
    this.state.data.command = command;

    this.props.setParentState(this.state.url, this.state.data)
  },
  render: function() {
    var commandValue = '';
    if (this.props.data.hasOwnProperty('command')) {
      commandValue = this.props.data.command;
    }
    return (
      <div className="input-group">
        <span className="input-group-addon" id="basic-addon1">Command</span>
        <input onChange={this.handleCommandChange} value={this.props.data.command} type="text" className="form-control" placeholder="ls -l" aria-describedby="basic-addon1"/>
      </div>
    );
  }
});

var ActionFooter = React.createClass({
  handleExecute: function(e) {
    $.ajax({
      url: this.props.data.url,
      type: 'POST',
      dataType: 'json',
      data: this.props.data.data,
      success: function() {

      },
      error: function() {

      }
    })
    this.props.setParentState({}, '');
  },
  render: function() {
    return (
      <div className='button-wrap'>
        <button onClick={this.handleExecute} id='execute-action' className='btn btn-warning'>Execute</button>
      </div>
    );
  }
});

//************************* ROUTER **************************

console.log(window.location.pathname);
//crappy temporary routing system
if (window.location.pathname == '/') {
  ReactDOM.render(
    <ServerBox url='/api/hosts' />,
    document.getElementById('servers'))
  ReactDOM.render(
    <ActionBox url='/api/hosts' />,
    document.getElementById('action'))
} else if (window.location.pathname == '/manager') {
  ReactDOM.render(
    <ManagerBox url='/api/hosts' />,
    document.getElementById('server-manager'))
}
