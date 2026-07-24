var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');
var whatsapp = require('./services/whatsapp');

var app = express();

app.use(logger('dev'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

if (process.env.WHATSAPP_BOT_ENABLED === 'true') {
  whatsapp.iniciarBot().catch(function (error) { console.error('Não foi possível iniciar o bot WhatsApp:', error.message); });
}

var pollingMinutes = Number(process.env.EDITAIS_POLL_MINUTES || 0);
if (Number.isFinite(pollingMinutes) && pollingMinutes >= 5) {
  var delay = pollingMinutes * 60 * 1000;
  setInterval(function () {
    apiRouter.atualizarNotificacoes().catch(function (error) { console.error('Falha na rotina de editais:', error.message); });
  }, delay).unref();
}

module.exports = app;
