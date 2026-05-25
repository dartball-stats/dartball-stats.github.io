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

		log("sqlite3 version",capi.sqlite3_libversion());

		// load database into arrayBuffer
		const arrayBuffer = await fetch('/db/dartball.crypt')
			.then(r => r.arrayBuffer())
			.then(r => decrypt(r,password))
			.catch(() => {
					error("Decryption failed. Check passphrase [" + password + "]");
					postData('passwordReset');
					});

			log("database bytelength = ",arrayBuffer.byteLength);

			// assuming arrayBuffer contains the result of the above operation...
			const p = sqlite3.wasm.allocFromTypedArray(arrayBuffer);
			const poolUtil = await sqlite3.installOpfsSAHPoolVfs()
				.catch(e => {error(e);});

			log("vfsName = ",poolUtil.vfsName);

			poolUtil.importDb("/dartball.sqlite3",arrayBuffer);
			const db = new poolUtil.OpfsSAHPoolDb("/dartball.sqlite3");
			const rc = capi.sqlite3_deserialize(
				db.pointer, 'main', p, arrayBuffer.byteLength, arrayBuffer.byteLength,
				sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE
			);
			db.checkRc(rc);

		 	log("transient db =",db.filename);
		
		try {
			// query database
			// 
			let query = 'SELECT tm_long as team'
				+', team_g as g'
				+', wins as w'/* {{{ */
				+', losses as l'
				+', win_pct'
				+', runs as rs'
				+', runs_against as ra'
				+', r_per_g'
				+', ra_per_g'
				+', pa'
				+', h'
				+', h3'
				+', e'
				+', avg'
				+', obp'
				+', slg'
				+', ops'
				+', ops_plus'
				+', woba'
				+', wrc_plus'
				+', wrc'
				+', aobp'
				+', xrc_plus AS arc_plus'
				+', xrc as arc'
				+', beta_war'
				+', id_team'
				+', id_season'
				+' FROM team_summary_stats_disp'
				+' WHERE id_season = ' + id_season + ' AND tf_post = 0'
				+' ORDER BY win_pct DESC, r_per_g DESC';/* }}} */
			let teamStats = sql2objArr(query,db);
			postData('teamStats',teamStats);

//			query = 'SELECT MAX(wins) AS w'
//				+', MAX(win_pct) AS win_pct'/* {{{ */
//				+', MAX(r_per_g) AS r_per_g'
//				+', MAX(team_g) AS g'
//				+', MAX(runs) AS r'
//				+', MAX(pa) AS pa'
//				+', MAX(h) AS h'
//				+', MAX(h3) AS h3'
//				+', MAX(e) AS e'
//				+', MAX(avg) AS avg'
//				+', MAX(obp) AS obp'
//				+', MAX(slg) AS slg'
//				+', MAX(ops) AS ops'
//				+', MAX(ops_plus) AS ops_plus'
//				+', MAX(woba) AS woba'
//				+', MAX(wrc_plus) AS wrc_plus'
//				+', MAX(wrc) AS wrc'
//				+', MAX(aobp) AS aobp'
//				+', MAX(xrc_plus) AS arc_plus'
//				+', MAX(xrc) AS arc'
//				+', MAX(beta_war) AS beta_war'
//				+' FROM team_summary_stats_disp'
//				+' WHERE id_season = ' + id_season + ' AND tf_post = 0'/* }}} */
//			let teamStatsMax = sql2objArr(query,db);
//			postData('teamStatsMax',teamStatsMax);

			query = 'SELECT season'
				+', SUM(team_g) AS g'/* {{{ */
				+', SUM(wins) AS w'
				+', SUM(losses) AS l'
				+', SUM(wins)/SUM(wins + losses + 0.0) AS win_pct'
				+', SUM(runs) AS rs'
				+', SUM(runs_against) AS ra'
				+', SUM(r_per_g * team_g) / SUM(r_per_g * team_g / r_per_g) AS r_per_g'
				+', SUM(ra_per_g * team_g) / SUM(ra_per_g * team_g / ra_per_g) AS ra_per_g'
				+', SUM(r) AS r'
				+', SUM(rbi) AS rbi'
				+', SUM(pa) AS pa'
				+', SUM(ab) AS ab'
				+', SUM(h) AS h'
				+', SUM(h3) AS h3'
				+', SUM(e) AS e'
				+', SUM(avg * ab)/SUM(ab) AS avg'
				+', SUM(obp * pa)/SUM(pa) AS obp'
				+', SUM(slg*ab)/SUM(ab) AS slg'
				+', SUM(ops*pa)/SUM(pa) AS ops'
				+', SUM(ops_plus*pa)/SUM(pa) AS ops_plus'
				+', SUM(woba*pa)/SUM(pa) AS woba'
				+', SUM(wrc_plus*pa)/SUM(pa) AS wrc_plus'
				+', SUM(wrc) AS wrc'
				+', SUM(aobp*pa)/SUM(pa) AS aobp'
				+', SUM(xrc_plus*pa)/SUM(pa) AS arc_plus'
				+', SUM(xrc) AS arc'
				+', SUM(beta_war) AS beta_war'
				+', id_season'
				+' FROM team_summary_stats_disp'
				+' WHERE id_season = ' + id_season + ' AND tf_post = 0';/* }}} */
			let leagueStats = (sql2objArr(query,db))[0];
			postData('leagueStats',leagueStats);

			query = 'SELECT season'
				+', SUM(team_g) AS g'/* {{{ */
				+', SUM(wins) AS w'
				+', SUM(losses) AS l'
				+', SUM(win_pct * team_g) / SUM(team_g) AS win_pct'
				+', SUM(runs) AS rs'
				+', SUM(runs_against) AS ra'
				+', SUM(r_per_g * team_g) / SUM(r_per_g * team_g / r_per_g) AS r_per_g'
				+', SUM(ra_per_g * team_g) / SUM(ra_per_g * team_g / ra_per_g) AS ra_per_g'
				+', SUM(r) AS r'
				+', SUM(rbi) AS rbi'
				+', SUM(pa) AS pa'
				+', SUM(ab) AS ab'
				+', SUM(h) AS h'
				+', SUM(h3) AS h3'
				+', SUM(e) AS e'
				+', SUM(avg * ab)/SUM(ab) AS avg'
				+', SUM(obp * pa)/SUM(pa) AS obp'
				+', SUM(slg*ab)/SUM(ab) AS slg'
				+', SUM(ops*pa)/SUM(pa) AS ops'
				+', SUM(ops_plus*pa)/SUM(pa) AS ops_plus'
				+', SUM(woba*pa)/SUM(pa) AS woba'
				+', SUM(wrc_plus*pa)/SUM(pa) AS wrc_plus'
				+', SUM(wrc) AS wrc'
				+', SUM(aobp*pa)/SUM(pa) AS aobp'
				+', SUM(xrc_plus*pa)/SUM(pa) AS arc_plus'
				+', SUM(xrc) AS arc'
				+', SUM(beta_war) AS beta_war'
				+', id_season'
				+' FROM team_summary_stats_disp'
				+' WHERE id_season = ' + id_season + ' AND tf_post = 1';/* }}} */
			let leagueStatsPost = (sql2objArr(query,db))[0];
			postData('leagueStatsPost',leagueStatsPost);

			query = 'SELECT season'
				+', SUM(team_g) AS g'/* {{{ */
				+', SUM(wins) AS w'
				+', SUM(losses) AS l'
				+', SUM(win_pct * team_g) / SUM(team_g) AS win_pct'
				+', SUM(runs) AS rs'
				+', SUM(runs_against) AS ra'
				+', SUM(r_per_g * team_g) / SUM(r_per_g * team_g / r_per_g) AS r_per_g'
				+', SUM(ra_per_g * team_g) / SUM(ra_per_g * team_g / ra_per_g) AS ra_per_g'
				+', SUM(r) AS r'
				+', SUM(rbi) AS rbi'
				+', SUM(pa) AS pa'
				+', SUM(ab) AS ab'
				+', SUM(h) AS h'
				+', SUM(h3) AS h3'
				+', SUM(e) AS e'
				+', SUM(avg * ab)/SUM(ab) AS avg'
				+', SUM(obp * pa)/SUM(pa) AS obp'
				+', SUM(slg*ab)/SUM(ab) AS slg'
				+', SUM(ops*pa)/SUM(pa) AS ops'
				+', SUM(ops_plus*pa)/SUM(pa) AS ops_plus'
				+', SUM(woba*pa)/SUM(pa) AS woba'
				+', SUM(wrc_plus*pa)/SUM(pa) AS wrc_plus'
				+', SUM(wrc) AS wrc'
				+', SUM(aobp*pa)/SUM(pa) AS aobp'
				+', SUM(xrc_plus*pa)/SUM(pa) AS arc_plus'
				+', SUM(xrc) AS arc'
				+', SUM(beta_war) AS beta_war'
				+', id_season'
				+' FROM team_summary_stats_disp'
				+' WHERE id_season = ' + id_season;/* }}} */
			let leagueStatsAll = (sql2objArr(query,db))[0];
			postData('leagueStatsAll',leagueStatsAll);

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
				+', ops_plus'
				+', woba'
				+', wrc_plus'
				+', wrc'
				+', aobp'
				+', xrc_plus AS arc_plus'
				+', xrc AS arc'
				//+', gxrc AS garc'
				+', beta_war'
				+', id_player'
				+', id_team'
				+', id_season'
				+', team_g'
				+' FROM player_stats_rate_disp psr'
				+' WHERE id_season = '+ id_season
				+' AND tf_post = 0'
				+' ORDER BY beta_war DESC';/* }}} */
			let playerStatsResult = sql2objArr(query,db);
			postData('playerStatsSummary',playerStatsResult);
			//console.log('playerStatsSummary =',playerStatsResult);

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
				+', ops_plus'
				+', woba'
				+', wrc_plus'
				+', wrc'
				+', aobp'
				+', xrc_plus AS arc_plus'
				+', xrc AS arc'
				//+', gxrc AS garc'
				+', beta_war'
				+', id_player'
				+', id_team'
				+', id_season'
				+', team_g'
				+' FROM player_stats_rate_disp psr'
				+' WHERE id_season = '+ id_season
				+' AND tf_post = 1'
				+' ORDER BY beta_war DESC';/* }}} */
			let playerStatsResultPost = sql2objArr(query,db);
			postData('playerStatsSummaryPost',playerStatsResultPost);
	
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
				+', ops_plus'
				+', woba'
				+', wrc_plus'
				+', wrc'
				+', aobp'
				+', xrc_plus AS arc_plus'
				+', xrc AS arc'
				//+', gxrc AS garc'
				+', beta_war'
				+', id_player'
				+', id_team'
				+', id_season'
				+', team_g'
				+' FROM player_stats_rate_all_disp psr'
				+' WHERE id_season = '+ id_season
				+' ORDER BY beta_war DESC';/* }}} */
			let playerStatsResultAll = sql2objArr(query,db);
			postData('playerStatsSummaryAll',playerStatsResultAll);
	
			query = 'SELECT MAX(wrc) AS wrc'
		//		+', MAX(gwrc) as gwrc'/* {{{ */
				+', MAX(xrc) AS arc'
				//+', MAX(gxrc) AS garc'
				+', MAX(beta_war) as beta_war'
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
				+' FROM player_stats_rate_disp'
				+' WHERE id_season = ' + id_season
				+' AND tf_post = 0';/* }}} */
			let playerStatsMax = (sql2objArr(query,db))[0];
			postData('playerStatsSummaryMax',playerStatsMax);
			
			query = 'SELECT MAX(wrc) AS wrc'
		//		+', MAX(gwrc) as gwrc'/* {{{ */
				+', MAX(xrc) AS arc'
				//+', MAX(gxrc) AS garc'
				+', MAX(beta_war) AS beta_war'
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
				+' FROM player_stats_rate_disp'
				+' WHERE id_season = ' + id_season
				+' AND tf_post = 1';/* }}} */
			let playerStatsMaxPost = (sql2objArr(query,db))[0];
			postData('playerStatsSummaryMaxPost',playerStatsMaxPost);

			query = 'SELECT MAX(wrc) AS wrc'
		//		+', MAX(gwrc) as gwrc'/* {{{ */
				+', MAX(xrc) AS arc'
				//+', MAX(gxrc) AS garc'
				+', MAX(beta_war) AS beta_war'
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
				+' FROM player_stats_rate_all_disp'
				+' WHERE id_season = ' + id_season
				+' AND id_team = ' + id_team;/* }}} */
			let playerStatsMaxAll = (sql2objArr(query,db))[0];
			postData('playerStatsSummaryMaxAll',playerStatsMaxAll);

			query = 'SELECT id_series'
				+', date_series'
				+', id_season'/* {{{ */
				+', id_team'
				+', id_team_opp'
				+', tm_long AS team'
				+', opp_long AS opp'
				+', w'
				+', l'
				+' FROM game_log_team_stats_disp'
				+' WHERE id_season = ' + id_season
				+' AND ha = \'h\''
				+' AND tf_post = 1'
				+' AND COALESCE(w,l) IS NOT NULL'
				+' ORDER BY date_series DESC';/* }}} */
			let playoffResults = sql2objArr(query,db);
			postData('playoffResults',playoffResults);


		} catch(e) {
			/* {{{ */
			if(e instanceof sqlite3.SQLite3Error){
				error("SQLite3Error:",e.message);
			}else{
				throw e;
			}
			/* }}} */
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

