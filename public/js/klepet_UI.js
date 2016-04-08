var jeSlika = false;
function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  
  /*function preveriSliko(){
    var besede = sporocilo.split(' ');
    var slika = false;
    for (var i = 0; i < besede.length; i++){
      var zacetekHTTP = besede[i].substring(0,6).toLowerCase();
      var zacetekHTTPS = besede[i].substring(0,7).toLowerCase();
      var konec = besede[i].substring(besede[i].length - 4,besede[i].length - 1).toLowerCase();
      if(((zacetekHTTP == 'http://') || (zacetekHTTPS == 'https://'))&&((konec=='jpg')||(konec=='png')||(konec=='gif'))){
        slika = true;
      }
    }
    return slika;
  }
  
  var jeSlika = preveriSliko();*/
  
  if (jeSlika){
    jeSlika = false;
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('px\' /&gt;', 'px\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  }
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSlike(sporocilo);
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    //sporocilo = dodajSlike(sporocilo.besedilo);
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

function dodajSlike(besedilo) {
  besede = besedilo.split(' ');
  var linki = [];
  for (var i = 0; i < besede.length; i++){
    var zacetekHTTP = besede[i].substring(0,7).toLowerCase();
    var zacetekHTTPS = besede[i].substring(0,8).toLowerCase();
    var konec = besede[i].substring(besede[i].length - 4,besede[i].length).toLowerCase();
    if(((zacetekHTTP == 'http://') || (zacetekHTTPS == 'https://'))&&((konec=='.jpg')||(konec=='.png')||(konec=='.gif'))){
      linki.push(besede[i]);
      jeSlika = true;
    }
  }
  
  /*var zamenjane = [];
  
  for(var i = 0; i < linki.length; i++){
    var temp = linki[i];
    var podvojena = false;
    for(var j = 0; j < zamenjane.length; j++){
      if(temp==zamenjane[j]){
        podvojena = true;
      }
    }
    linki[i] = "<img src='" + linki[i] + "' width='200' style='margin-left:20px' />"
    if(podvojena==true){
      var indeks = besedilo.lastIndexOf(temp);
      var besediloDva = besedilo.slice(indeks, besedilo.length);
      besedilo = besedilo.substring(0, indeks);
      var besediloTri = besediloDva.replace(temp, linki[i]);
      var besedilo = besedilo.concat(besediloTri);
    } else {
      besedilo = besedilo.replace(temp, linki[i]);
      zamenjane.push(temp);
    }
    }*/
    function zamenjajZLinkom(beseda){
      var link = "<img src='" + beseda + "' width='200' style='margin-left:20px' />"
      beseda = beseda.replace(beseda, link);
      return beseda;
    }
    for(var i = 0; i < besede.length; i++){
      for(var j = 0; j < linki.length; j++){
        if(besede[i]==linki[i]){
          besede[i] = zamenjajZLinkom(besede[i]);
        }
      }
    }
    besedilo = '';
    for(var i = 0; i < besede.length; i++){
      besedilo += besede[i]
      if(i!=besede.length-1){
        besedilo+=' ';
      }
    }
  return besedilo;
}
