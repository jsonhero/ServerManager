var host_queue = [];
var currentScript = '';

$('#log-close').on('click', function() {
  $('.log-layover').hide();
});

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
      }.bind(this)
    });
  },
  sortGroups: function(hosts) {
    var hostgroups = [];
    var groups = {};
    hosts.forEach(function(host) {
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
            <a href='/manager'><span className='glyphicon glyphicon-plus'></span> Add Server</a>
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
    return {data: []};
  },
  managerSubmit: function(host) {
    var hosts = this.state.data;
    var newHosts = hosts.concat([host])
    this.setState({ data: newHosts });
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
    return {hostname: '', hostgroup: '', host: '', username: '', password: ''};
  },
  handleHostChange: function(e) {
    this.setState({hostname: e.target.value});
  },
  handleGroupChange: function(e) {
    this.setState({hostgroup: e.target.value});
  },
  handleUsernameChange: function(e) {
    this.setState({username: e.target.value});
  },
  handlePasswordChange: function(e) {
    this.setState({password: e.target.value});
  },
  handleIPChange: function(e) {
    this.setState({host: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var host = this.state.hostname.trim();
    var group = this.state.hostgroup.trim();
    var ip = this.state.host.trim();
    var username = this.state.username.trim();
    var password = this.state.password.trim();

    if (!host || !group || !ip) {
      return;
    }
    this.props.onManagerSubmit({hostname: host, hostgroup: group, host: ip, username: username, password: password});
    this.setState({hostname: '', hostgroup: '', host: '', username: '', password: ''});
  },
  render: function() {
    return (
      <form className="managerForm" onSubmit={this.handleSubmit}>
        <div className='FormLabel'>IP: </div>
        <input className='form-control' value={this.state.host} type="text" onChange={this.handleIPChange} placeholder="Host IP..." />
        <div className='FormLabel'>Host Name: </div>
        <input className='form-control' value={this.state.hostname} onChange={this.handleHostChange} type="text" placeholder="Host name..." />
        <div className='FormLabel'>Host Group: </div>
        <input className='form-control' value={this.state.hostgroup} onChange={this.handleGroupChange} type="text" placeholder="Host group..." />
        <div className='FormLabel'>Username: </div>
        <input className='form-control' value={this.state.username} onChange={this.handleUsernameChange} type="text" placeholder="Host username..." />
        <div className='FormLabel'>Password: </div>
        <input className='form-control' value={this.state.password} onChange={this.handlePasswordChange} type="password" placeholder="Host password..." />
        <input id='manager-submit' className='form-control' type="submit" value="Submit" />
      </form>
    );
  }
});


var TableList = React.createClass({
  render: function() {
    var nodes = this.props.data.map(function(host) {
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

//************************* ACTION SELECTOR **************************

var ActionSelector = React.createClass({
  getInitialState: function() {
    return { component: {}}
  },
  componentDidMount: function() {
    var self = this;
    window.addEventListener('actionMount', function (e) {
      self.setState({component: e.detail});
    });
  },
  handleChangeAction: function(e) {
    var value = e.target.value;
    this.state.component.setState({data: {}, action: value});
  },
  render: function() {
    return (
      <div className='action-comp'>
        <div className='action-comp-wrapper'>
          <h4>Select an Action:</h4>
          <select onChange={this.handleChangeAction} className='form-control'>
            <option value='execute'>
              Execute Command
            </option>
            <option value='copy'>
              Copy
            </option>
            <option value='jar'>
              Update Jars
            </option>
            <option value='screen'>
              Screen Action
            </option>
            <option value='put'>
              Put
            </option>
          </select>
        </div>
      </div>
    );
  }
});

//************************* ACTION EXECUTOR **************************

var ActionBox = React.createClass({
  getInitialState: function() {
    return {data: {}, url: '', action: ''};
  },
  componentDidMount: function() {
    var evt = new CustomEvent('actionMount', { detail: this });
    window.dispatchEvent(evt);
  },
  setParentState: function(url, data) {
    this.setState({data: data, url: url}, function() {
    });
  },
  render: function() {
    var name = 'Execute Command';
    var actionType = this.state.action;
    var action,
        executor = <ActionFooter setParentState={this.setParentState} data={this.state} />
    if (actionType == 'execute' || actionType == '') {
      name = 'Execute Command';
      action = <ActionCommand data={this.state.data} setParentState={this.setParentState}/>;
    } else if (actionType == 'copy') {
      name = 'Copy File';
      action = <ActionCopy data={this.state.data} setParentState={this.setParentState}/>;
    } else if (actionType == 'put') {
      name = 'Put a file';
      action = <ActionPut data={this.state.data} setParentState={this.setParentState}/>;
    } else if (actionType == 'jar') {
      name = 'Update a jar';
      action = <ActionJar data={this.state.data} setParentState={this.setParentState}/>;
    } else if (actionType == 'screen') {
      name = 'Manipulate Server Screens'
      action = <ActionScreen data={this.state.data} setParentState={this.setParentState}/>;
    }

    if (window.location.pathname == '/scriptor') {
      executor = <ScriptFooter setParentState={this.setParentState} data={this.state} />
    }

    return (
    <div className='components'>
      <div className='component-header'>
        <div className='component-name'>
          {name}
        </div>
      </div>
      <div className='component-body'>
        <div className='comp-body-wrap'>
          {action}
        </div>
      </div>
      <div className='component-footer'>
        {executor}
      </div>
    </div>
  );
  }
});

var ActionCommand = React.createClass({
  getInitialState: function() {
    return {url: '/api/action/command', type: 'command', data: {command: ''}};
  },
  handleCommandChange: function(e) {
    var command = e.target.value;
    this.setState({
      data: { command: command, type: this.state.type, info: command}
    }, function() {
      this.props.setParentState(this.state.url, this.state.data);
    });
  },
  render: function() {
    return (
      <div className="input-group">
        <span className="input-group-addon" id="basic-addon1">Command</span>
        <input onChange={this.handleCommandChange} value={this.props.data.command} type="text" className="form-control" placeholder="ls -l" aria-describedby="basic-addon1"/>
      </div>
    );
  }
});

var ActionJar = React.createClass({
  getInitialState: function() {
    return {url: '/api/action/jar', jarlist: [], type: 'jar', data: {jar: ''}};
  },
  componentDidMount: function() {
    $.ajax({
      url: '/api/jars',
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState(function(state) {
          state.jarlist = data;
          return state;
        });
      }.bind(this),
      error: function() {

      }
    })
  },
  handleJarChange: function(e) {
    var jar = e.target.value;
    this.setState({
      data: { jar: jar, type: this.state.type, info: 'Paste ' + jar}
    }, function() {
      this.props.setParentState(this.state.url, this.state.data);
    });
  },
  render: function() {
    var options = this.state.jarlist.map(function(option) {
      return (
        <option value={option.name}>{option.name}</option>
      )
    });
    return (
      <div className='component'>
        <label>Select jar to update/add: </label>
        <select onChange={this.handleJarChange} className='form-control'>
          <option value='' disabled>- Select A Jar -</option>
          {options}
        </select>
      </div>
    );
  }
});

var ActionScreen = React.createClass({
  getInitialState: function() {
    return {url: '/api/action/screen', type: 'screen', data: {screenAction: ''}};
  },
  handleScreenChange: function(e) {
    var action = e.target.value;
    this.setState({
      data: { screenAction: action, type: this.state.type, info: action + ' selected servers'}
    }, function() {
      this.props.setParentState(this.state.url, this.state.data);
    });
  },
  componentDidMount: function() {
    this.setState({
      data: { screenAction: 'start', type: this.state.type, info: 'start selected servers'}
    }, function() {
      this.props.setParentState(this.state.url, this.state.data);
    });
  },
  render: function() {
    return (
      <div className='component'>
        <label>Select a Screen Action:</label>
        <select onChange={this.handleScreenChange} className='form-control'>
          <option value='' disabled>- Select A Screen Action -</option>
          <option value='start'>Start</option>
          <option value='stop'>Stop</option>
          <option value='restart'>Restart</option>
        </select>
      </div>
    );
  }
});


var ActionPut = React.createClass({
  getInitialState: function() {
    return {
    url: '/api/action/put/',
    type: 'put',
    info: '',
    data: {localpath: '', remotepath: ''}};
  },
  handleLocalPathChange: function(e) {
    var info = 'Local: ' + this.state.data.localpath + ' Remote: ' + this.state.data.remotepath;
    var localpath = e.target.value;
    this.setState({
      data: { localpath: localpath, remotepath: this.state.data.remotepath, type: this.state.type, info: info}
    }, function() {
      this.props.setParentState(this.state.url, this.state.data)
    });
  },
  handleRemotePathChange: function(e) {
    var info = 'Local: ' + this.state.data.localpath + ' Remote: ' + this.state.data.remotepath;
    var remotepath = e.target.value;
    this.setState({
      data: { localpath: this.state.data.localpath, remotepath: remotepath, type: this.state.type, info: info}
    }, function() {
      this.props.setParentState(this.state.url, this.state.data)
    });
  },
  render: function() {
    return (
      <div className='action-input'>
        <div className="input-group">
          <span className="input-group-addon" id="basic-addon1">Local Path:</span>
          <input onChange={this.handleLocalPathChange} type="text" className="form-control" placeholder="local..." aria-describedby="basic-addon1"/>
        </div>
        <div className="input-group">
          <span className="input-group-addon" id="basic-addon1">Remote Path:</span>
          <input onChange={this.handleRemotePathChange} type="text" className="form-control" placeholder="remote..." aria-describedby="basic-addon1"/>
        </div>
      </div>
    );
  }
});

var ActionCopy = React.createClass({
  getInitialState: function() {
    return {url: '/api/action/copy/', files: [], data: {copyfile: '', pathname: ''}};
  },
  handlePathNameChange: function(e) {
    var pathname = e.target.value;
    this.setState(function(state) {
      state.data.pathname = pathname;
      return state;
    }, function() {
      this.props.setParentState(this.state.url, this.state.data)
    });
  },
  handleCopyChange: function(e) {
    var file = e.target.value;
    this.setState(function(state) {
      state.data.copyfile = file;
      return state;
    }, function() {
      this.props.setParentState(this.state.url, this.state.data)
    });
  },
  componentDidMount: function() {
    $.ajax({
      url: '/api/loadcopy',
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState(function(state) {
          state.files = data;
          return state;
        });
      }.bind(this),
      error: function() {

      }
    });
  },
  render: function() {
    var nodes = this.state.files.map(function(file) {
      return (
        <option value={file}>{file}</option>
      )
    });
    return (
      <div className='action-input'>
        <label>Copies to all folders in '/game/servers'</label>
        <div className="input-group">
          <span className="input-group-addon" id="basic-addon1">File To Copy (Located in /manager/copy)</span>
          <select onChange={this.handleCopyChange}className="form-control" aria-describedby="basic-addon1">
            {nodes}
          </select>
        </div>
        <div className="input-group">
          <span className="input-group-addon" id="basic-addon1">Path to save to</span>
          <input onChange={this.handlePathNameChange} value={this.props.data.foldername} type="text" className="form-control" placeholder="/plugins/MCRL....Leave blank to copy to server root" aria-describedby="basic-addon1"/>
        </div>
      </div>
    );
  }
});

var ActionFooter = React.createClass({
  handleExecute: function(e) {
    var data = this.props.data.data;
    console.log("hosts", host_queue, this.props);
    data.servers = host_queue;

    if (!this.props.data.url) {
      alert("Enter valid input!");
    }
    // console.log(this.props.data.url, "URL", "DATA", data);
    if (host_queue.length < 1) {
      alert('Enter a server!');
      return;
    }

    $.ajax({
      url: this.props.data.url,
      type: 'POST',
      dataType: 'json',
      data: data,
      success: function() {

      },
      error: function() {

      }
    })

    if (data.type != 'jar' || data.type != 'screen') {
      this.props.setParentState(this.props.data.url, {});
    }
  },
  render: function() {
    return (
      <div className='button-wrap'>
        <button onClick={this.handleExecute} id='execute-action' className='btn btn-warning'>Execute</button>
      </div>
    );
  }
});

//************************* SERVER STATUS **************************

var StatusBox = React.createClass({
  getInitialState: function() {
    return { data: [] }
  },
  loadHistory: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function() {
      }
    });
  },
  componentDidMount: function() {
    this.loadHistory();
    setInterval(this.loadHistory, this.props.pollInterval)
  },
  render: function() {
    return (
      <div className='component'>
        <div className='component-header'>
          <div className='component-name'>
            Server History <span> (Last 10 Minutes)   </span>
          </div>
        </div>
          <StatusList data={this.state.data}/>
      </div>
    );
  }
});

var StatusList = React.createClass({
  render: function() {
    var nodes = this.props.data.map(function(log) {
      return (
          <StatusRow data={log} />
      )
    }).reverse();
    return (
      <div className='component-body'>
        <table className='table table-striped'>
          <tbody>
          {nodes}
          </tbody>
        </table>
      </div>
    )
  }
});

var StatusRow = React.createClass({
  handleLogClick: function(e) {
    $('#log-output').text(this.props.data.output);
    console.log(this.props.data.output);
    $('#log-server').text(this.props.data.hostname + ' Output');
    $('#log-date').text(moment(this.props.data.date).format("MMMM Do YYYY, h:mm a"));
    $('#log-cmd').text(this.props.data.actiontype + ": " + this.props.data.action);
    $('.log-layover').show();
  },
  render: function() {
    var status = 'success';
    if (this.props.data.error) status = "danger";
    return(
      <tr className={status + ' log-row'} >
        <td>
          {this.props.data.user}
        </td>
        <td>
          {this.props.data.hostname}
        </td>
        <td>
          {this.props.data.actiontype + ": " + this.props.data.action}
        </td>
        <td>
          {moment(this.props.data.date).format("MMMM Do YYYY, h:mm a")}
        </td>
        <td onClick={this.handleLogClick}>
          <div className='server-log'>Log</div>
        </td>
      </tr>
    )
  }
});

//************************* History **************************

var HistoryBox = React.createClass({
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
      error: function() {
      }
    });
  },
  sortGroups: function(hosts) {
    var hostgroups = [];
    var groups = {};
    hosts.forEach(function(host) {
      var group = host.hostname;
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
      <div className='component'>
        <div className='history-header'>
          <h3 className='history-text'>Server History</h3>
        </div>
          <HistoryGroups data={this.state.data}/>
      </div>
    );
  }
});

var HistoryGroups = React.createClass({
  render: function() {
    var groupNodes = this.props.data.map(function(group) {
      return (
        <div className='component-wrapper'>
          <div className='component-header'>
            <div className='component-name'>
              {group.name}
            </div>
          </div>
          <StatusList data={group.hosts} />
        </div>
      );
    });
    return (
      <div className='component'>
        {groupNodes}
      </div>
    );
  }
});

//************************* SCRIPT PAGE **************************

var ScriptSelector = React.createClass({
  getInitialState: function() {
    return { data: [], name: '', current: ''};
  },
  componentDidMount: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function() {
      }
    });
  },
  handleChangeAction: function(e) {
    var current = e.target.value;
    currentScript = current;
    this.setState({current: current});
  },
  handleCreateScript: function(e) {
    var name = this.state.name;
    if (name.length < 1) {
      alert('Please enter a valid script name!');
      return;
    }

    $.ajax({
      dataType: 'json',
      type: 'POST',
      data: {name: name},
      url: '/api/script',
      success: function() {

      },
      error: function() {

      }
    });
  },
  handleNameChange: function(e) {
    var name = e.target.value;
    this.setState({name: name});
  },
  handleDeleteScript: function(e) {
    var name = this.state.current;
    $.ajax({
      dataType: 'json',
      data: {name: name},
      type: 'DELETE',
      url: '/api/script/',
      success: function() {

      },
      error: function() {

      }
    });
  },
  render: function() {
    var options = this.state.data.map(function(option) {
      return (
        <option key={option.name} value={option.name}> {option.name} </option>
      )
    });
    return (
      <div className='action-comp'>
        <div className='action-comp-wrapper'>
          <h4>Edit Existing Script:</h4>
          <select defaultValue='' onChange={this.handleChangeAction} className='form-control'>
            <option disabled>Select a Script</option>
            {options}
          </select>
          <div className='button-wrap'>
            <ScriptEdit name={this.state.current}/>
            <button onClick={this.handleDeleteScript} className='btn btn-danger'>Delete</button>
          </div>
        </div>
        <div className='component-footer'>
          <div className="input-group">
            <span className="input-group-addon" id="basic-addon1">Script Name</span>
            <input onChange={this.handleNameChange} type="text" className="form-control" placeholder="Name..." aria-describedby="basic-addon1"/>
          </div>
          <div className='button-wrap'>
            <button onClick={this.handleCreateScript} id='create-script' className='btn btn-primary'>Create New Script</button>
          </div>
        </div>
      </div>
    );
  }
});

var ScriptEdit = React.createClass({
  handleEditScript: function(e) {
    if (this.props.name) {
      var poop = document.getElementById('select-script');
      ReactDOM.unmountComponentAtNode(poop);
      ReactDOM.render(
        <ScriptBox name={this.props.name}/>,
        document.getElementById('script-maker'))
      ReactDOM.render(
        <ActionSelector />,
        document.getElementById('action-selector'))
      ReactDOM.render(
        <ActionBox url='/api/hosts' />,
        document.getElementById('action'))
    }
  },
  render: function() {
    return (
      <button onClick={this.handleEditScript} className='btn btn-warning'>Edit</button>
    );
  }
});

var ScriptBox = React.createClass({
  getInitialState: function() {
    return {data: { actions: []}};
  },
  removeAndUpdate: function(i) {
    this.setState(function(state) {
      state.data.actions.splice(i, 1);
      return {data: {actions: state.data.actions}};
    });
  },
  updateBox: function() {
    $.ajax({
      url: '/api/script/' + this.props.name,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function() {

      }
    });
  },
  componentDidMount: function() {
    this.updateBox();
    setInterval(this.updateBox, 500);
  },
  render: function() {
    return (
      <div className='component'>
        <div className='component-header'>
          <div className='component-name'>
            Script: {this.props.name}
          </div>
        </div>
        <div className='component-body'>
          <div className='comp-body-wrap'>
            <ScriptTable removeAndUpdate={this.removeAndUpdate} data={this.state.data}/>
          </div>
        </div>
      </div>
    );
  }
});

var ScriptTable = React.createClass({
  render: function() {
    var self = this;
    var rows = this.props.data.actions.map(function(action, i) {
      return (
        <ScriptRow removeAndUpdate={self.props.removeAndUpdate} index={i} action={action}/>
      )
    });
    return (
      <table className='table table-striped'>
        <thead>
          <tr>
            <th>
              Action
            </th>
            <th>
              Info
            </th>
            <th>
              Edit
            </th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    );
  }
});

var ScriptRow = React.createClass({
  handleDelete: function(e) {
    $.ajax({
      type: 'DELETE',
      url: '/api/script/action',
      dataType: 'json',
      data: {id: this.props.action._id, script: currentScript},
      success: function() {

      },
      error: function() {

      }
    });
    this.props.removeAndUpdate(this.props.index);
  },
  render: function() {
    return (
      <tr id={this.props.action._id}>
        <td>{this.props.action.type}</td>
        <td>{this.props.action.info}</td>
        <td><button data-id={this.props.action._id} onClick={this.handleDelete} className='btn btn-danger'>Delete</button></td>
      </tr>
    )
  }
})

var ScriptFooter = React.createClass({
  handleExecute: function(e) {
    var data = this.props.data.data;
    data.script = currentScript;

    $.ajax({
      url: '/api/script/action',
      type: 'POST',
      dataType: 'json',
      data: data,
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
        <button onClick={this.handleExecute} id='execute-action' className='btn btn-success'>Add to Script</button>
      </div>
    );
  }
});

//*************************  SCRIPTSHIT **************************

var ScriptActor = React.createClass({
  getInitialState: function() {
    return { data: []};
  },
  componentDidMount: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data})
      }.bind(this),
      error: function() {

      }
    });
  },
  handleScriptExecute: function(e) {
    var ele = document.getElementById('selected-script');
    $.ajax({
      url: '/api/action/script',
      type: 'POST',
      dataType: 'json',
      data: {script: ele.value, servers: host_queue},
      success: function() {

      },
      error: function() {

      }
    });
  },
  render: function() {
    var options = this.state.data.map(function(option) {
      return (
        <option value={option.name}>{option.name}</option>
      )
    });
    return (
      <div className='component'>
        <div className='component-header'>
          <div className='component-name'>
            Scripts
          </div>
        </div>
        <div className='component-body'>
          <div className='comp-body-wrap'>
            <select id='selected-script' className='form-control'>
              {options}
            </select>
          </div>
        </div>
        <div className='component-footer'>
          <div className='button-wrap'>
            <button onClick={this.handleScriptExecute} id='execute-script' className='btn btn-primary'>Execute Script</button>
          </div>
        </div>
      </div>
    )
  }
});

//************************* SERVER STATUS **************************

var ServerStatusBox = React.createClass({
  getInitialState: function() {
    return {data: []};
  },
  sortCategories: function(servers) {
    var categories = {};
    var serverCats = [];

    servers.forEach(function(server) {
      var category = server.lilly_name.match(/([a-z]+)_\d+/)[1];
      var stats = server.data;
      if (!categories[category]) {
        categories[category] = {
          name: category,
          playerCount: 0 + parseInt(stats.playersOnline),
          addToCount: function(num) {
            this.playerCount += num;
          },
          servers: [server]
        };
      } else {
        categories[category].servers.push(server);
        categories[category].addToCount(parseInt(stats.playersOnline));
      }
    });

    var keys = Object.keys(categories);
    serverCats = keys.map(function(category) {
      return categories[category];
    });
    return serverCats;
  },
  serversUpdate: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        var servers = this.sortCategories(data);
        this.setState({data: servers});
      }.bind(this),
      error: function() {
      }
    });
  },
  componentDidMount: function() {
    this.serversUpdate();
    setInterval(this.serversUpdate, 2000);
  },
  render: function() {
    var categories = this.state.data.map(function(category) {
      return (
        <div className='server-category'>
          <div className='server-category-header'>
            <div className='server-category-name'>
              {category.name} Players: {category.playerCount}
            </div>
          </div>
          <StatusServers data={category.servers}/>
          <div className='clear'>
          </div>
        </div>
      )
    });
    var totalPlayerCount = this.state.data.reduce(function(count, category) {
      return count + category.playerCount;
    }, 0);

    return (
      <div className='component'>
        <div className='playerCount-container'>
          <div className='playerCount'>
            Total Players: {totalPlayerCount}
          </div>
        </div>
        {categories}
      </div>
    )
  }
});

var StatusServers = React.createClass({
  render: function() {
    var servers = this.props.data.map(function(server) {
      return (
        <StatusServer data={server}/>
      )
    });
    return (
      <div className='servers'>
        {servers}
      </div>
    )
  }
});

var StatusServer = React.createClass({
  componentDidMount: function() {
    var stats = this.props.data.data;
    var ele = document.getElementById(this.props.data.lilly_name);
    if (stats.online === false) {
      ele.style.backgroundColor = 'rgb(252, 77, 53)';
    } else if (stats.playersOnline < 1) {
      ele.style.backgroundColor = 'rgb(11, 136, 201)';
    } else if (stats.playersOnline == stats.maxPlayersOnline) {
      ele.style.backgroundColor = 'rgb(252, 221, 53)';
    }
  },
  render: function() {
    var stats = this.props.data.data;
    return (
      <div id={this.props.data.lilly_name} className='server'>
        <div className='server-header'>
          <div className='server-name'>
            {this.props.data.lilly_name}
          </div>
        </div>
        <div className='server-body'>
          <div className='server-tps'>
            TPS: {stats.ticksPerSecond.toFixed(3)}
          </div>
          <div className='server-uptime'>
            Uptime: {stats.uptime}
          </div>
          <div className='server-players'>
            {stats.playersOnline}/{stats.maxPlayersOnline} Players
          </div>
        </div>
      </div>
    )
  }
});

//************************* ROUTER **************************

//crappy temporary routing system
if (window.location.pathname == '/') {
  ReactDOM.render(
    <ServerBox url='/api/hosts' />,
    document.getElementById('servers'))
  ReactDOM.render(
    <ScriptActor url='/api/scripts'/>,
    document.getElementById('script'))
  ReactDOM.render(
    <ActionSelector />,
    document.getElementById('action-selector'))
  ReactDOM.render(
    <ActionBox url='/api/hosts' />,
    document.getElementById('action'))
  ReactDOM.render(
    <StatusBox url='/api/action/history' pollInterval={2000}/>,
    document.getElementById('status'))
} else if (window.location.pathname == '/manager') {
  ReactDOM.render(
    <ManagerBox url='/api/hosts' />,
    document.getElementById('server-manager'))
} else if (window.location.pathname == '/history') {
  ReactDOM.render(
    <HistoryBox url='/api/action/allhistory' />,
    document.getElementById('history'))
} else if (window.location.pathname == '/scriptor') {
  ReactDOM.render(
    <ScriptSelector url='/api/scripts'/>,
    document.getElementById('select-script'))
} else if (window.location.pathname == '/status') {
  ReactDOM.render(
    <ServerStatusBox url='/api/serverstatus'/>,
    document.getElementById('serverstatus'))
}
