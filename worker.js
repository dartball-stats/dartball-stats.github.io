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

	importScripts('/jswasm/sqlite3.js');
	importScripts('/js/crypto.js');
	
	const main = async function(sqlite3,password) {
/* {{{ */
		const urlParams = new URL(globalThis.location.href).searchParams;
		const id_team = urlParams.get("t") ?? 13;
		const id_season = urlParams.get("y") ?? 4;
		const capi = sqlite3.capi/*C-style API*/;
		const oo = sqlite3.oo1/*high-level OO API*/;
		const arrayBuffer = await fetch('/db/dartball.crypt')
			.then(r => r.arrayBuffer())
			.then(r => decrypt(r,password));

		// assuming arrayBuffer contains the result of the above operation...
		const p = sqlite3.wasm.allocFromTypedArray(arrayBuffer);
		const poolUtil = await sqlite3.installOpfsSAHPoolVfs();
		poolUtil.importDb("/dartball.sqlite3",arrayBuffer);
		const db = new poolUtil.OpfsSAHPoolDb("/dartball.sqlite3");
		const rc = capi.sqlite3_deserialize(
			db.pointer, 'main', p, arrayBuffer.byteLength, arrayBuffer.byteLength,
			sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
		);
		db.checkRc(rc);

		log("sqlite3 version",capi.sqlite3_libversion());
		log("database bytelength = ",arrayBuffer.byteLength);
   	log("transient db =",db.filename);
		
		try {
			//  query database{{{
			// team schedule
			let query = 'SELECT week'
				+', date_series'/* {{{ */
				+', ha'
				+', opp_long AS opp'
				+', venue'
				+', w'
				+', l'
				+', r'
				+', wrc'
				+', luck'
				+', pa'
				+', h'
				//+', h1'
				+', h3'
				+', e'
				+', avg'
				+', obp'
				+', slg'
				+', ops'
				+', woba'
				+', aobp'
				+', ops_plus'
				+', wrc_plus'
				+', xrc_plus AS arc_plus'
				+', id_team'
				+', id_series'
				+', id_season'
				+', id_team_opp'
				+' FROM game_log_team_stats_disp'
				+' WHERE id_team = '+ id_team + ' AND id_season = '+ id_season
				+' ORDER BY id_series ASC';/* }}} */
			let scheduleResult = sql2objArr(query,db);
			postData('schedule',scheduleResult);
			//console.log('schedule = ',scheduleResult);
	
			// team stat totals
			query = 'SELECT team_g'
				+', wins as w'
				+', losses as l'/* {{{ */
				+', win_pct'
				+', runs'
				+', r_per_g'
				+', wrc'
				+', (runs - wrc) as luck'
				+', pa'
				+', ab'
				+', h'
				//+', h1'
				+', h3'
				+', e'
				+', avg'
				+', obp'
				+', slg'
				+', ops'
				+', ops_plus'
				+', woba'
				+', wrc_plus'
				+', aobp'
				+', xrc_plus AS arc_plus'
				+', xrc AS arc'
				+', gxrc AS garc'
				+', r'
				+', rbi'
				+', player_g as g'
				+', season'
				+', tm_long'
				+', tm_short'
				+', id_season'
				+', id_team'
				+' FROM team_summary_stats_all_disp'
				+' WHERE id_team = '+ id_team +' AND id_season = '+ id_season;/* }}} */
			let teamSummary = sql2objArr(query,db)[0];
			postData('teamSummary',teamSummary);
			//console.log('teamSummary =',teamSummary);
	
			query = 'SELECT name'
				+', tm_short as team'/* {{{ */
				+', g'
				+', pa'
				+', ab'
				+', h'
				//+', h1'
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
				+', xrc AS arc'
				+', gxrc AS garc'
				+', id_player'
				+', id_team'
				+', id_season'
				+' FROM player_stats_rate_all_disp psr'
				+' WHERE id_season = '+ id_season
				+' AND id_team = ' + id_team
				+' ORDER BY xrc DESC';/* }}} */
			let playerStatsResult = sql2objArr(query,db);
			postData('playerStatsSummary',playerStatsResult);
			//console.log('playerStatsSummary =',playerStatsResult);
	
			query = 'SELECT MAX(wrc) AS wrc'
		//		+', MAX(gwrc) as gwrc'{{{
				+', MAX(xrc) AS arc'
				+', MAX(gxrc) AS garc'
				+', MAX(g) AS g'
				+', MAX(pa) AS pa'
				+', MAX(ab) AS ab'
				+', MAX(h) AS h'
				//+', MAX(h1) AS h1'
				+', MAX(h3) AS h3'
				+', MAX(e) AS e'
				+', MAX(r) AS r'
				+', MAX(rbi) AS rbi'
				+', MAX(avg) AS avg'
				+', MAX(obp) AS obp'
				+', MAX(slg) AS slg'
				+', MAX(ops) AS ops'
				+', MAX(woba) AS woba'
				+', MAX(aobp) AS aobp'
				+', MAX(ops_plus) AS ops_plus'
				+', MAX(wrc_plus) AS wrc_plus'
				+', MAX(xrc_plus) AS arc_plus'
				+' FROM player_stats_rate_all'
				+' WHERE id_season = ' + id_season
				+' AND id_team = ' + id_team;/* }}} */

			let playerStatsMax = (sql2objArr(query,db))[0];
			postData('playerStatsSummaryMax',playerStatsMax);
			//console.log('playerStatsMax =',playerStatsMax);

			/* }}} */
		} catch(e) {
			if(e instanceof sqlite3.SQLite3Error){/* {{{ */
				error("SQLite3Error:",e.message);
			}else{
				throw e;
			}/* }}} */
		} finally {
			db.close();
			poolUtil.removeVfs();
			poolUtil.wipeFiles();
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

