(function(){
  let logHtml;
	console.log("Running script from Worker thread.");
	logHtml = function(cssClass,...args){
		postMessage({/* {{{ */
			type:'log',
			payload:{cssClass, args}
		});/* }}} */
	};
	postData = function(dataType,arg){
		postMessage({/* {{{ */
			type: dataType,
			payload:{arg}
		});/* }}} */
	};

  const log = (...args)=>logHtml('',...args);
  const warn = (...args)=>logHtml('warning',...args);
  const error = (...args)=>logHtml('error',...args);

	importScripts('/jswasm/sqlite3.js');
	importScripts('/js/crypto.js');

	const main = async function(sqlite3,password) {
/* {{{ */
		const urlParams = new URL(globalThis.location.href).searchParams;
		const id_team = urlParams.get("t") ?? 13;
		const id_series = urlParams.get("s") ?? 10;
		const capi = sqlite3.capi/*C-style API*/;
		const oo = sqlite3.oo1/*high-level OO API*/;
		const arrayBuffer = await fetch('/db/dartball.crypt')
			.then(r => r.arrayBuffer())
			.then(r => decrypt(r,password));
//		const arrayBuffer = fetch('dartball.sqlite3').then(res => res.arrayBuffer());

		sql2objArr = function(query,db) {
			let output = [];/* {{{ */
			try {
		    db.exec({
		      sql: query,
		      rowMode: 'object', // 'array' (default), 'object', or 'stmt'
					resultRows: output,
		    });
				return output;
			} catch(e) {
				error(e);
			};/* }}} */
		};

		// assuming arrayBuffer contains the result of the above operation...
		const p = sqlite3.wasm.allocFromTypedArray(arrayBuffer);
		const db = new oo.DB();
		const rc = capi.sqlite3_deserialize(
			db.pointer, 'main', p, arrayBuffer.byteLength, arrayBuffer.byteLength,
			sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
		);
		db.checkRc(rc);
		oo.OpfsDb.importDb("dartball.sqlite3", arrayBuffer);

		log("sqlite3 version",capi.sqlite3_libversion(), capi.sqlite3_sourceid());
		log((oo.OpfsDb) ? 'Opfs available' : 'Opfs NOT available');
		log("database bytelength = ",arrayBuffer.byteLength);
   	log("transient db =",db.filename);
		
		try {
			//  query database{{{
			//  team info/stats
			let query = 'SELECT tm_long as team'
				+', season'
				+', week'
				+', date_series'
				+', ha'
				+', opp_long AS opp'
				+', venue'
				+', g'
				+', w'
				+', l'
				+', wrc'
				+', luck'
				+', pa'
				+', ab'
				+', h'
				+', h1'
				+', h3'
				+', e'
				+', r'
				+', r AS rbi'
				+', xrc AS arc'
				+', gxrc AS garc'
				+', avg'
				+', obp'
				+', slg'
				+', ops'
				+', ops_plus'
				+', woba'
				+', wrc_plus'
				+', aobp'
				+', xrc_plus AS arc_plus'
				+', id_team'
				+', id_series'
				+', g as team_g'
				+' FROM game_log_team_stats_disp'
				+' WHERE id_team = '+ id_team + ' AND id_series = '+ id_series
				+' ORDER BY id_series ASC';
			let teamSummary = sql2objArr(query,db)[0];

			query = 'SELECT MAX(id_series) AS id'
				+' FROM game_log'
				+' WHERE id_team = ' + id_team + ' AND id_series < ' + id_series;
			teamSummary.id_series_prev = sql2objArr(query,db)[0]["id"];

			query = 'SELECT MIN(id_series) AS id'
				+' FROM game_log'
				+' WHERE id_team = ' + id_team + ' AND id_series > ' + id_series;
			teamSummary.id_series_next = sql2objArr(query,db)[0]["id"];

			postData('teamSummary',teamSummary);
		
			// player stats
			query = 'SELECT name'
				+', tm_short AS team'
				+', g'
				+', pa'
				+', ab'
				+', h'
				+', h1'
				+', h3'
				+', e'
				+', r'
				+', rbi'
				+', avg'
				+', obp'
				+', slg'
				+', ops'
				+', woba'
				+', aobp'
				+', ops_plus'
				+', wrc_plus'
				+', xrc_plus AS arc_plus'
				+', wrc'
				+', xrc as arc'
				+', gxrc as garc'
				+', id_player'
				+', id_team'
				+', id_season'
				+' FROM player_series_log_rate_disp'
				+' WHERE id_team = '+ id_team +' AND id_series = ' + id_series
				+' ORDER BY xrc DESC';
			let playerStats = sql2objArr(query,db);
			postData('playerStats',playerStats);

			query = 'SELECT MAX(g) AS g'
				+', MAX(pa) AS pa'
				+', MAX(ab) AS ab'
				+', MAX(h) AS h'
				+', MAX(h1) AS h1'
				+', MAX(h3) AS h3'
				+', MAX(e) AS e'
				+', MAX(r) AS r'
				+', MAX(rbi) AS rbi'
				+', MAX(wrc) AS wrc'
				+', MAX(xrc) AS arc'
				+', MAX(gxrc) AS garc'
				+', MAX(avg) AS avg'
				+', MAX(obp) AS obp'
				+', MAX(slg) AS slg'
				+', MAX(ops) AS ops'
				+', MAX(ops_plus) AS ops_plus'
				+', MAX(woba) AS woba'
				+', MAX(wrc_plus) AS wrc_plus'
				+', MAX(aobp) AS aobp'
				+', MAX(xrc_plus) AS arc_plus'
				+' FROM player_series_log_rate_disp'
				+' WHERE id_team = '+ id_team +' AND id_series = ' + id_series
				+' ORDER BY xrc DESC';
			let playerStatsMax = sql2objArr(query,db)[0];
			postData('playerStatsMax',playerStatsMax);
			/* }}} */
		} catch(e) {
			if(e instanceof sqlite3.SQLite3Error){/* {{{ */
				log("Got expected exception from nested db.savepoint():",e.message);
				log("count(*) from t =",db.selectValue("select count(*) from t"));
			}else{
				throw e;
			}/* }}} */
		} finally {
			db.close();
		}
/* }}} */
	};
  
	self.onmessage = function(e) {
		let password = e.data.password;
	
		globalThis.sqlite3InitModule({
	    /* We can redirect any stdout/stderr from the module like so, but
	       note that doing so makes use of Emscripten-isms, not
	       well-defined sqlite APIs. */
	    print: log,
	    printErr: error
	  }).then(function(sqlite3){
	    log("Done initializing. Running ...");
	    try {
		      main(sqlite3,password);
	    }catch(e){
	      error("Exception:",e.message);
	    }
	  });
	}
})();
