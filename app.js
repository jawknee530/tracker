var express = require('express');
var app = express();
var fs = require("fs");
var contents = fs.readFileSync("data.json");
var data = JSON.parse(contents);

var findTorrent = function(data, hash) {
  for(var i = 0; i < data.length; i++) {
    if(data[i].info_hash === hash) {
      return data[i];
    }
  }
  return false;
}

var findID = function(data, qPort, qip) {
  for(var i = 0; i < data.length; i++) {
    //console.log(data[i].peer_id);
    if(data[i].port == qPort && data[i].ip === qip) {
      return true;
    }
  }
  return false;
}

var findHash = function(data, id) {
  for(var i = 0; i < data.length; i++) {
    if(data[i].peer_id === id) {
      return data[i];
    }
  }
  return false;
}

function hashy (str) {
  var url = str;
  var hexval = '';

  for(var i = 0; i < url.length; i++) {
    if(url[i] !== '%') {
      var code = url.charCodeAt(i);
      var hex = code.toString(16);
      hexval += hex;
    } else {
      hexval += url[i+1] + url[i+2];
      i += 2;
    }
  }
  return hexval;
}

app.get('/', function(req, res) {

  console.log(req.query);
  var info_hash = hashy(req.query.info_hash);
  console.log(info_hash);
  var peer_id = decodeURIComponent(req.query.peer_id);
  var escaped = escape(req.query.peer_id);
  console.log('escaped ' + escaped);
  console.log('decoded ' + peer_id);
  console.log('normal  ' + req.query.peer_id);

  var ip = req.connection.remoteAddress;
  if(ip.substring(0,7) == '::ffff:') {
    ip = ip.substring(7);
  }
  //var port = req.connection.remotePort;
  var port = req.query.port;
  console.log(ip);
  var torrent = findTorrent(data, info_hash);
  var completed;
  if (torrent === false){
    if(req.query.left === '0') {
      completed = true;
    } else {
      completed = false;
    }
    var obj = { "info_hash" : info_hash, "peers" : [{ "peer_id" : peer_id, "ip" : ip, "port" : port, "completed" : completed }]};
    data.push(obj);
    torrent = obj;
    //console.log(obj.peers);
  }
  else {
    //figure out if completed
    if(req.query.left == '0') {
      completed = true;
    } else {
      completed = false;
    }
    
    var peer = findHash(torrent.peers, peer_id);
    if(peer === false){
      var obj = { "peer_id" : peer_id, "ip" : ip, "port" : port, "completed" : completed };
      torrent.peers.push(obj);
    }
    else {
      peer.ip = ip;
      peer.port = port;
      peer.completed = completed;
    }
  }
  
  if(torrent) {
    var response = bencode(torrent);
  }
  else {
    response = 'error';
  }

  //console.log(data);

  fs.writeFileSync("data.json", JSON.stringify(data, null, 2), 'utf-8');
  res.send(response);
});

var bencode = function(torrent) {
  var response = 'd8:intervali600e12:min intervali30e'
  var complete = 0;
  var incomplete = 0;
  for(var i = 0; i < torrent.peers.length; i++) {
    if(torrent.peers[i].completed === true) {
      complete++;
    } else {
      incomplete++;
    }
  }
  var response = response.concat('8:completei' + complete + 'e');
  var response = response.concat('10:incompletei' + incomplete + 'e5:peersl');
  for(var i = 0; i < torrent.peers.length; i++) {
    response = response.concat('d');
    response = response.concat('2:ip');
    response = response.concat(torrent.peers[i].ip.length + ':');
    response = response.concat(torrent.peers[i].ip);
    //response = response.concat('7:peer id');
    //response = response.concat(torrent.peers[i].peer_id.length + ':');
    //response = response.concat(torrent.peers[i].peer_id);
    response = response.concat('4:port');
    response = response.concat('i' + torrent.peers[i].port + 'e');
    response = response.concat('e');
  }
  response = response.concat('ee');
  console.log(response);
  return response;
}

app.listen(4000, function() {
  console.log('Example app listening on port 4000!');
});
