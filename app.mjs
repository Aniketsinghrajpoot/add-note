import { default as express} from 'express';
import { notes } from './models/notes-store.mjs';
import { default as hbs} from 'hbs';
import { default as DBG} from 'debug';
import * as path from 'path';
import { default as logger} from 'morgan';
import { default as cookieParser} from 'cookie-parser';
import { default as bodyParser} from 'body-parser';
import { default as rfs} from 'rotating-file-stream';
import * as http from 'http';
import { approotdir} from './approotdir.mjs';
const __dirname = approotdir;
import { normalizePort, onError, onListening, basicErrorHandler} from './appsupport.mjs';
import { router as indexRouter} from './routes/index.mjs';
import { router as notesRouter} from './routes/notes.mjs';
import { InMemoryNotesStore  } from './models/notes-memory.mjs';

import { useModel as useNoteModel } from './models/notes-store.mjs';
useNoteModel(process.env.NOTES_MODEL? process.env.NOTES_MODEL : "memory")
.then(store => {  } )
.catch(error => { onError({ code: 'ENNOTESSTORE', error});});

export const NotesStore = new InMemoryNotesStore();
export const app = express();
export const debug = DBG('notes:debug');
export const dbgerror = DBG('notes:error');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'partials'));

if(process.env.REQUEST_LOG_FILE){
         app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev',{
         stream: process.env.REQUEST_LOG_FILE?
         rfs.createStream(process.env.REQUEST_LOG_FILE,{
            size : '10M',   //rotate every 10 megabytes written
            interval: '1d',   //rotate daily
            compress: 'gzip'   //compress rotated files
        })
        :process.stdout
    }));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules/bootstrap', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/node_modules/jquery', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.use('/node_modules/popper.js', express.static(path.join(__dirname, 'node_modules', 'popper.js', 'dist', 'umd')));   
app.use('/node_modules/feather-icons',express.static(path.join(__dirname, 'node_modules', 'feather-icons', 'dist')));

app.use('/', indexRouter);
app.use('/notes', notesRouter);

// catch 404 and forward to error handler
// app.use(handle404);
app.use(basicErrorHandler);
export const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);


export const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
server.on('request', (req, res) =>{
    debug(`${new Date() .toISOString()} request ${req.method} ${req.url}`);
});

app.listem(port, ()=>{
    console.log(`listening to the port no at ${port}`);
})