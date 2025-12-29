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
		const id_player = urlParams.get("p") ?? 1;
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
			// player series log
			let query = 'SELECT season'
				+', week'/* {{{ */
				+', date_series'
				+', ha'
				+', opp_short AS opp'
//				+', venue'
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
				+', id_season'
				+', id_team'
				+', id_series'
				+', id_team_opp'
				+' FROM player_series_log_rate_disp'
				+' WHERE id_player = '+ id_player
				+' ORDER BY date_series ASC';/* }}} */
			let scheduleResult = sql2objArr(query,db);
			postData('schedule',scheduleResult);
	
			// player season totals
			query = 'SELECT season'
				+', tm_short as team'/* {{{ */
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
				+', xrc AS arc'
				+', gxrc AS garc'
				+', id_player'
				+', id_team'
				+', id_season'
				+' FROM player_stats_rate_all_disp'
				+' WHERE id_player = '+ id_player +' ORDER BY season ASC';/* }}} */
			let playerStatsResult = sql2objArr(query,db);
			postData('playerSeasonStats',playerStatsResult);
			//console.log('playerStatsSummary =',playerStatsResult);

			// player career totals
			query = 'SELECT g'
				+', pa'/* {{{ */
				+', ab'
				+', h'
				+', h1'
				+', h3'
				+', e'
				+', r'
				+', rbi'
				+', wrc'
				+', xrc as arc'
				+', gxrc as garc'
				+', avg'
				+', obp'
				+', slg'
				+', ops'
				+', ops_plus'
				+', woba'
				+', wrc_plus'
				+', aobp'
				+', xrc_plus AS arc_plus'
				+', name'
				+' FROM player_career_all_disp'
				+' WHERE id_player = '+ id_player;/* }}} */
			let playerCareerResults = sql2objArr(query,db)[0];
			postData('playerCareerStats',playerCareerResults);

			/* }}} */
		} catch(e) {
			if(e instanceof sqlite3.SQLite3Error){/* {{{ */
				log("Got expected exception from nested db.savepoint():",e.message);
				log("count(*) from t =",db.selectValue("select count(*) from t"));
			}else{
				throw e;
			}/* }}} */
		}	finally {
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
