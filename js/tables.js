"use strict";
class dartball {
	static	printTeamSchedule(schedule,teamSummary,tableId) {
		/* {{{ */
		if ((teamSummary) && Array.isArray(teamSummary)) {
			teamSummary = teamSummary[0];
		}
	
		const noPrint = ["id_season","id_team","id_series","l","id_team_opp"];

		const div = document.getElementById("div_team_schedule");
		const table = document.createElement("table");
		div.appendChild(table);
		table.setAttribute("id",(tableId ?? "table_schedule"));
		table.setAttribute("class","sortable stats_table");
	
		/* caption */
		const caption = table.createCaption();
		caption.textContent = "Team Schedule";
	
		/* colgroup */
		const colgroup = document.createElement("colgroup");
		table.appendChild(colgroup);

		/* thead */
		let thead = table.createTHead();
		let tr = thead.insertRow();
		for (const key in schedule[0]) {
			if (noPrint.includes(key)) {continue;};
//			if (key === 'l') {continue;};
			let th = this.createTH(key);
			tr.appendChild(th);
		}
	
		/* tbody */
		let tbody = table.createTBody();
		schedule.forEach(row => {
			let tr = tbody.insertRow();
			for (const key in row) {
				if (noPrint.includes(key)) {continue;};
//			if (key === 'l') {continue;};
				let td = this.createTD(key,row);
				if (key === 'date_series') {
					let inner = td.innerHTML;
					td.innerHTML = '';
					let a = document.createElement("a");
					td.appendChild(a);
					a.innerHTML = inner;
					a.href = "/gamelog?t=" + row.id_team + "&s=" + row.id_series;
				};
				if (key === 'opp') {
					let inner = td.innerHTML;
					td.innerHTML = '';
					let a = document.createElement("a");
					td.appendChild(a);
					a.innerHTML = inner;
					a.href = "/?t=" + row.id_team_opp + "&y=" + row.id_season;
				};

					
				tr.appendChild(td);
			}
		});
		tbody.addEventListener('click', (event) => {
				event.target.closest('tr').classList.toggle('rowSum');
		});

		/* tfoot */
		if (typeof teamSummary !== 'undefined') {
			let tfoot = table.createTFoot();
			tr = tfoot.insertRow();
			for (const key in schedule[0]) {
				if (noPrint.includes(key)) {continue;};
			//	if (key === 'l') {continue;};
				let th = this.createTHfoot(key,teamSummary);
				tr.appendChild(th);
			}
		}
		
		/* fill colgroup */
		let n_cols = tr.cells.length;
		for (let i = 0; i < n_cols; i++) {
			let col = document.createElement("col");
			colgroup.appendChild(col);
		};

		/* make sortable */
		new SortableTable(table);

		/* }}} */
	}
	
	static printPlayerStats(playerStats,teamSummary,playerStatsMax) {
		/* {{{ */
		if ((playerStatsMax) && Array.isArray(playerStatsMax)) {
			playerStatsMax = playerStatsMax[0];
		}
	
		if ((teamSummary) && Array.isArray(teamSummary)) {
			teamSummary = teamSummary[0];
		}
	
		const noPrint = ["id_season","id_team","id_player","team_g","id_series"];

		const div = document.getElementById("div_players_stats");
		const table = document.createElement("table");
		div.appendChild(table);
		table.setAttribute("id","table_player_stats");
		table.setAttribute("class","sortable stats_table css-serial sticky_table");
//		table.setAttribute("data-cols-to-freeze","1,2");
	
		/* caption */
		const caption = table.createCaption();
		caption.textContent = "Team Player Stats";
	
		/* colgroup */
		const colgroup = document.createElement("colgroup");
		table.appendChild(colgroup);
		
		/* thead */
		let thead = table.createTHead();
		let tr = thead.insertRow();

		let th = document.createElement("th");// ranker column
		tr.appendChild(th);
		th.setAttribute("class","center num");
		th.textContent = "Rk";

		for (const key in playerStats[0]) {
			if (noPrint.includes(key)) {continue;};
			let th = this.createTH(key);
			tr.appendChild(th);
		}
	
		/* tbody */
		const min_pa = teamSummary.team_g * 3.1;
		let tbody = table.createTBody();
		let counter = 0;
		playerStats.forEach(row => {
			let tr = tbody.insertRow();

			// for hiding non-qualifiers for rate stats
			if (row.pa < min_pa) {tr.classList.add("non_qual");};


			// ranker column
			counter++;
			let td = document.createElement("td");
			tr.appendChild(td);
			td.setAttribute("class","right");
			td.setAttribute("csk",counter);

			for (const key in row) {

				if (noPrint.includes(key)) {continue;};

				let td = this.createTD(key,row);
				tr.appendChild(td);
				if (key === "name") { /* make name linkable */
					let inner = td.innerHTML;
					td.innerHTML = '';
					let a = document.createElement("a");
					td.appendChild(a);
					a.innerHTML = inner;
					a.href = "/player?p=" + row.id_player;
				} else if (key === "team") {
					let inner = td.innerHTML;
					td.innerHTML = '';
					let a = document.createElement("a");
					td.appendChild(a);
					a.innerHTML = inner;
					a.href = "/?t=" + row.id_team + "&y=" + row.id_season;

				} else if ((playerStatsMax) && row[key] === playerStatsMax[key]) {
					/* value is table maximum => make STRONG */
					td.innerHTML = "<strong>" + td.textContent + "</strong>";
				}
			}
		});
		tbody.addEventListener('click', (event) => {
				event.target.closest('tr').classList.toggle('rowSum');
		});
		
		if (teamSummary) {
			/* tfoot */
			let tfoot = table.createTFoot();
			tr = tfoot.insertRow();
	
			// ranker column
			th = document.createElement("th");
			tr.appendChild(th);		
	
			for (const key in playerStats[0]) {
				if (noPrint.includes(key)) {continue;};
				let td = this.createTHfoot(key,teamSummary);
				tr.appendChild(td);
			};
		};

		/* fill colgroup */
		let n_cols = tr.cells.length;
		for (let i = 0; i < n_cols; i++) {
			let col = document.createElement("col");
			colgroup.appendChild(col);
		};

		/* make sortable */
		new SortableTable(table);

		/* only show rate qualifiers if box checked and sorted by rate stat */
		const rows_nq = table.querySelectorAll("tbody tr.non_qual");
		const checkbox = document.getElementById("fs_check_players_standard_batting");

		checkbox.addEventListener('change', function() {
				/* if query returns node, then table is sorted by rate stat */
				const hideNonQual = (table.querySelector("thead th.hide_non_quals.sort_col") !== null);
				if (this.checked && hideNonQual) {
					rows_nq.forEach( (r) => {r.style.display = "none";});
				} else {
					rows_nq.forEach( (r) => {r.style.removeProperty("display");});
				};
		});

		table.querySelectorAll("thead th").forEach( (th) => {
				if (th.classList.contains("hide_non_quals")) {
					th.addEventListener("click", (e) => {
							if (checkbox.checked) {
								rows_nq.forEach( (r) => {r.style.display = "none";});
							} else {
								rows_nq.forEach( (r) => {r.style.removeProperty("display");});
							};
					});
				} else {
					th.addEventListener("click", (e) => {
							rows_nq.forEach( (r) => {r.style.removeProperty("display");});
					});
				};
		});

	/* }}} */
	}

	static printTeamInfo(teamSummary) {
/* {{{ */
		if (teamSummary) {
			document.title = teamSummary.season + " " + teamSummary.tm_long + " Statistics";
			const div_info = document.getElementById("info");
			const h1 = div_info.querySelector("h1");
	
			// heading
			h1.innerHTML = '<span>' + teamSummary.season + '</span> '
				+'<span>' + teamSummary.tm_long + '</span> '
				+'<span class="header_end">Statistics</span> ';
			let div = div_info.querySelector(".prevnext");
	
			// prev season button
			if (teamSummary.id_season > 1) {
				let a = div_info.querySelector(".button2.prev");
				a.href = ".?t=" + teamSummary.id_team + "&y=" + (teamSummary.id_season - 1);
				a.textContent = (Number(teamSummary.season) - 1) + " Season";
			} else {
				div_info.querySelector(".button2.prev").remove();
			};
	
			// next season button
			if (teamSummary.id_season < 4) {
				let a = div_info.querySelector(".button2.next")
				a.href = ".?t=" + teamSummary.id_team + "&y=" + (teamSummary.id_season + 1);
				a.textContent = (Number(teamSummary.season) + 1) + " Season";
			} else {
				div_info.querySelector(".button2.next").remove();
			};
	
			// team summary info
			div = document.createElement("div");
			h1.parentNode.appendChild(div);
			
			
			let p = document.createElement("p");
			div.appendChild(p);
			p.innerHTML = "<strong>Games Played:</strong> " 
				+ teamSummary.team_g;
	
			if (teamSummary.w !== null) {
				p = document.createElement("p");
				div.appendChild(p);
				p.innerHTML = "<strong>Record:</strong> " 
					+ teamSummary.w + "-" + teamSummary.l
					+ " (" + (teamSummary.win_pct).toFixed(3).replace(/^0+/,'') + ")";
			}
			
			if (teamSummary.rbi !== null) {
				p = document.createElement("p");
				div.appendChild(p);
				p.innerHTML = "<strong>Runs:</strong> " 
					+ teamSummary.runs 
					+ " (" + (teamSummary.r_per_g).toFixed(2) + " r/g)";
		
				p = document.createElement("p");
				div.appendChild(p);
				p.innerHTML = "<strong>wRC:</strong> " 
					+ (teamSummary.wrc).toFixed(1)
					+ " (" + (teamSummary.wrc / teamSummary.team_g).toFixed(2) + " wRC/g)";

				p = document.createElement("p");
				div.appendChild(p);
				p.innerHTML = "<strong>aRC:</strong> " 
					+ (teamSummary.arc).toFixed(1)
					+ " (" + (teamSummary.arc / teamSummary.team_g).toFixed(2) + " wRC/g)";

				p = document.createElement("p");
				div.appendChild(p);
				p.innerHTML = "<strong>wOBA:</strong> " 
					+ (teamSummary.woba).toFixed(3).replace(/^0+/,'')
					+ " (" + (teamSummary.wrc_plus).toFixed(0) + " wRC+)";

				p = document.createElement("p");
				div.appendChild(p);
				p.innerHTML = "<strong>aOBP:</strong> " 
					+ (teamSummary.aobp).toFixed(3).replace(/^0+/,'')
					+ " (" + (teamSummary.arc_plus).toFixed(0) + " aRC+)";

			}
		} else {
			document.title = "No Data";
			const div_info = document.getElementById("info");
			const h1 = div_info.querySelector("h1");
	
			// heading
			h1.innerHTML = 'No Data';
		}
/* }}} */
	}

	static printGameInfo(teamSummary) {
/* {{{ */
		if (teamSummary) {
			document.title = teamSummary.date_series + ' ' + teamSummary.team + ' Game Log';/* {{{ */
			const div_info = document.getElementById("info");
			const h1 = div_info.querySelector("h1");
	
			// heading
			h1.innerHTML = '<span>' + teamSummary.team + ' ' + teamSummary.date_series + ' Statistics';
		
			let div = div_info.querySelector(".prevnext");
				// prev season button
			if (teamSummary.id_series_prev !== null) {
				let a = div_info.querySelector(".button2.prev");
				a.href = "/gamelog?t=" + teamSummary.id_team + "&s=" + teamSummary.id_series_prev;
				a.textContent = "Previous"
			} else {
				div_info.querySelector(".button2.prev").remove();
			};
	
			// next season button
			if (teamSummary.id_series_next !== null) {
				let a = div_info.querySelector(".button2.next")
				a.href = "/gamelog?t=" + teamSummary.id_team + "&s=" + teamSummary.id_series_next;
				a.textContent = "Next";
			} else {
				div_info.querySelector(".button2.next").remove();
			};
	
			// team summary info
			div = document.createElement("div");
			h1.parentNode.appendChild(div);

			let p = document.createElement("p");
			div.appendChild(p);
			p.innerHTML = "<strong>Series:</strong> "
				+ teamSummary.season + " Wk# " + teamSummary.week + " (" + teamSummary.date_series + ")";

			p = document.createElement("p");
			div.appendChild(p);
			p.innerHTML = "<strong>Opponent:</strong> "
				+ ((teamSummary.ha === "a")?"@":"") + teamSummary.opp;

			p = document.createElement("p");
			div.appendChild(p);
			p.innerHTML = "<strong>Venue:</strong> "
				+ teamSummary.venue;

			if (teamSummary.g !== null) {
			p = document.createElement("p");
			div.appendChild(p);
			p.innerHTML = "<strong>Games Played:</strong> " 
				+ teamSummary.g;
			};
	
			if (teamSummary.w !== null) {
				p = document.createElement("p");
				div.appendChild(p);
				p.innerHTML = "<strong>Record:</strong> " 
					+ teamSummary.w + "-" + teamSummary.l
					+ " (" + (teamSummary.w/ (teamSummary.w + teamSummary.l)).toFixed(3).replace(/^0+/,'') + ")";
			};

			if (teamSummary.rbi !== null) {
				let team_gp = (teamSummary.w + teamSummary.l);
				p = document.createElement("p");
				div.appendChild(p);
				p.innerHTML = "<strong>Runs:</strong> " 
					+ teamSummary.rbi 
					+ " (" + (teamSummary.rbi / team_gp).toFixed(2) + " r/g)";
		
				p = document.createElement("p");
				div.appendChild(p);
				p.innerHTML = "<strong>wRC:</strong> " 
					+ (teamSummary.wrc).toFixed(1)
					+ " (" + (teamSummary.wrc / team_gp).toFixed(2) + " wRC/g)";
			};/* }}} */
		} else {
			document.title = "No Data";
			const div_info = document.getElementById("info");
			const h1 = div_info.querySelector("h1");
	
			// heading
			h1.innerHTML = 'No Data';
		};
/* }}} */
	}

	static printPlayerInfo(playerCareerStats) {
/* {{{ */
		if (playerCareerStats) {
			document.title = playerCareerStats.name + " Statistics";
			const div_info = document.getElementById("info");
			const h1 = div_info.querySelector("h1");
	
			// heading
			h1.innerHTML = '<span>' + playerCareerStats.name + '</span> ';
	
		} else {
			document.title = "No Data";
			const div_info = document.getElementById("info");
			const h1 = div_info.querySelector("h1");
	
			// heading
			h1.innerHTML = 'No Data';
		}
 /* }}} */
	}

	static thText = {
		/* {{{ */
		season: "Season",
		week: "Wk",
		date_series:"Date",
		ha: "",
		opp: "Opp",
		venue: "Venue",
		w: "W-L",
		r: "R",
		r_per_g: "R/G",
		rbi: "RBI",
		luck: "Luck",
		g: "G",
		pa: "PA",
		ab: "AB",
		h: "H",
		h1: "1B",
		h2: "2B",
		h3: "3B",
		hr: "HR",
		e: "EBB",
		avg: "AVG",
		obp: "OBP",
		slg: "SLG",
		ops: "OPS",
		woba: "wOBA",
		aobp: "aOBP",
		wrc: "wRC",
		arc: "aRC",
		gwrc: "gwRC",
		garc: "gaRC",
		ops_plus: "OPS+",
		wrc_plus: "wRC+",
		arc_plus: "aRC+",
		name: "Name",
		team: "Team",
		lg_woba: "lg wOBA",
		woba_scale: "wOBA Scale",
		woba_w1b: "wOBA w1B",
		woba_w3b: "wOBA w3B",
		woba_webb: "wOBA wEBB",
		lg_wrc_per_pa: "lg wRC/PA",
		lg_aobp: "lg aOBP",
		aobp_scale: "aOBP Scale",
		aobp_w1b: "aOBP w1B",
		aobp_w3b: "aOBP w3B",
		aobp_webb: "aOBp wEBB",
		lg_arc_per_pa: "lg aRC/PA",
		lg_pa_per_g: "lg PA/G"
		/* }}} */
	};
	
	static tdStyle = {
		/* {{{ */
		/*display style codes:
		 * i: integer
		 * s: string
		 * c: cumulant (wRC)
		 * r: rate (avg)
		 * p: rate_plus (wrc+, etc.)
		 * ha: ha (@ or '')
		 * wl: win-loss
		 * luck: luck (+/- c)
		 */
		season: "i",
		week: "i",
		date_series: "s",
		ha: "ha",
		opp: "s",
		venue: "s",
		w: "wl",
		r: "i",
		r_per_g: "r",
		rbi: "i",
		luck: "luck",
		g: "i",
		pa: "i",
		ab: "i",
		h: "i",
		h1: "i",
		h2: "i",
		h3: "i",
		hr: "i",
		e: "i",
		avg: "r",
		obp: "r",
		slg: "r",
		ops: "r",
		woba: "r",
		aobp: "r",
		wrc: "c",
		arc: "c",
		gwrc: "c",
		garc: "c",
		ops_plus: "p",
		wrc_plus: "p",
		arc_plus: "p",
		name: "s",
		team: "s",
		win_pct: "r",
		lg_woba: "r",
		woba_scale: "r",
		woba_w1b: "r",
		woba_w3b: "r",
		woba_webb: "r",
		lg_wrc_per_pa: "r",
		lg_aobp: "r",
		aobp_scale: "r",
		aobp_w1b: "r",
		aobp_w3b: "r",
		aobp_webb: "r",
		lg_arc_per_pa: "r",
		lg_pa_per_g: "r"


		/* }}} */
	};

	static createTH(key) {
		/* {{{ */
		const th = document.createElement("th");
		th.textContent = this.thText[key];
		let colType = this.tdStyle[key];

		switch (colType) {
			case "r":
			case "p":
				th.setAttribute("class","poptip center hide_non_quals num");
				break;
			case "s":
			case "ha":
				th.setAttribute("class","poptip center");
				break;
			default:
				th.setAttribute("class","poptip center num");
		};

//	/* add aria-sort indicator */
		const span = document.createElement("span");
		th.appendChild(span);
		span.setAttribute("aria-hidden","true");

		return th;
		/* }}} */
	}

	static createTD(key,row) {
		/* {{{ */
		/* creates td element in table body
		 * key: attribute of object
		 * row: object of table row returned from worker
		 */
		const td = document.createElement("td");
		let colType = this.tdStyle[key];
		let val = row[key];
		if (val === null) {
			td.textContent = "";
			td.setAttribute("csk","");
			return td;
		};

		switch (colType) {
			case "s":
				td.textContent = val;
				td.setAttribute("csk",val);
				td.setAttribute("class","left");
				break;
			case "i":
				td.textContent = val;
				td.setAttribute("csk",val);
				td.setAttribute("class","right");
				break;
			case "r":
				td.textContent = (val).toFixed(3).replace(/^0+/,'');
				td.setAttribute("csk",val);
				td.setAttribute("class","right");
				break;
			case "p":
				td.textContent = (val).toFixed(0);
				td.setAttribute("csk",val);
				td.setAttribute("class","right");
				break;
			case "ha":
				td.textContent = (val === "a") ? '@' : '';
				td.setAttribute("csk",val);
				td.setAttribute("class","right");
				break;
			case "wl":
				td.textContent = (row.l !== null) ? ((row.w).toString() + '-' + (row.l).toString()) : '';
				td.setAttribute("csk",(row.w - row.l));
				td.setAttribute("class","center");
				break;
			case "c":
				td.textContent = (val).toFixed(1);
				td.setAttribute("csk",val);
				td.setAttribute("class","right");
				break;
			case "luck":
				td.textContent = ((val > 0) ? '+' : '') + (val).toFixed(1);
				td.setAttribute("csk",val);
				td.setAttribute("class","right");
		};
		return td;
		/* }}} */
	}

	static createTHfoot(key,row) {
		/* {{{ */
		/* creates th element in table foot
		 * key: attribute of object
		 * row: object of table row returned from worker
		 */
		const th = document.createElement("th");
		let colType = this.tdStyle[key];

		/* if row[key] does not exist, return empty <th> */
		if (!(key in row)) {return th;};

		let val = row[key];

		if (val === null) {return th;};

		switch (colType) {
			case "s":
				th.textContent = val;
				th.setAttribute("class","left");
			case "i":
				th.textContent = val;
				th.setAttribute("class","right");
				break;
			case "r":
				th.textContent = (val).toFixed(3).replace(/^0+/,'');
				th.setAttribute("class","right");
				break;
			case "p":
				th.textContent = (val).toFixed(0);
				th.setAttribute("class","right");
				break;
			case "ha":
				th.textContent = (val === "a") ? '@' : '';
				th.setAttribute("class","right");
				break;
			case "wl":
				th.textContent = (row.w).toString() + '-' + (row.l).toString();
				th.setAttribute("class","center");
				break;
			case "c":
				th.textContent = (val).toFixed(1);
				th.setAttribute("class","right");
				break;
			case "luck":
				th.textContent = ((val > 0) ? '+' : '') + (val).toFixed(1);
				th.setAttribute("class","right");
		};
		return th;
		/* }}} */
	}
}


/*
 *   This content is licensed according to the W3C Software License at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 *   File:   sortable-table.js
 *
 *   Desc:   Adds sorting to a HTML data table that implements ARIA Authoring Practices
 */

class SortableTable {
/* {{{ */
  constructor(tableNode) {
/* {{{ */
    this.tableNode = tableNode;

    this.columnHeaders = tableNode.querySelectorAll('thead th');
		this.cols = tableNode.querySelectorAll('colgroup col');

    this.sortColumns = [];

    for (var i = 0; i < this.columnHeaders.length; i++) {
      var ch = this.columnHeaders[i];
      var buttonNode = ch;
      if (buttonNode) {
        this.sortColumns.push(i);
        buttonNode.setAttribute('data-column-index', i);
        buttonNode.addEventListener('click', this.handleClick.bind(this));
      }
    }

    this.optionCheckbox = document.querySelector(
      'input[type="checkbox"][value="show-unsorted-icon"]'
    );

    if (this.optionCheckbox) {
      this.optionCheckbox.addEventListener(
        'change',
        this.handleOptionChange.bind(this)
      );
      if (this.optionCheckbox.checked) {
        this.tableNode.classList.add('show-unsorted-icon');
      }
    }
/* }}} */
  }

  setColumnHeaderSort(columnIndex) {
/* {{{ */
    if (typeof columnIndex === 'string') {
      columnIndex = parseInt(columnIndex);
    }

    for (var i = 0; i < this.columnHeaders.length; i++) {
      var ch = this.columnHeaders[i];
			var col = this.cols[i];
      var buttonNode = ch;
			col.classList.remove("sort_col");// remove class from <col>
			ch.classList.remove("sorttable_sorted","sort_col");// remove class from <th>
      if (i === columnIndex) {
				col.classList.add("sort_col");
				ch.classList.add("sorttable_sorted","sort_col");
        var value = ch.getAttribute('aria-sort');
        if (value === 'descending') {
          ch.setAttribute('aria-sort', 'ascending');
          this.sortColumn(
            columnIndex,
            'ascending',
            ch.classList.contains('num')
          );
        } else {
          ch.setAttribute('aria-sort', 'descending');
          this.sortColumn(
            columnIndex,
            'descending',
            ch.classList.contains('num')
          );
        }
      } else {
        if (ch.hasAttribute('aria-sort') && buttonNode) {
          ch.removeAttribute('aria-sort');
        }
      }
    }
/* }}} */
  }

  sortColumn(columnIndex, sortValue, isNumber) {
/* {{{ */
    function compareValues(a, b) {
      if (sortValue === 'ascending') {
        if (a.value === b.value) {
          return 0;
        } else {
          if (isNumber) {
            return a.value - b.value;
          } else {
            return a.value < b.value ? -1 : 1;
          }
        }
      } else {
        if (a.value === b.value) {
          return 0;
        } else {
          if (isNumber) {
            return b.value - a.value;
          } else {
            return a.value > b.value ? -1 : 1;
          }
        }
      }
    }

    if (typeof isNumber !== 'boolean') {
      isNumber = false;
    }

    var tbodyNode = this.tableNode.querySelector('tbody');
    var rowNodes = [];
    var dataCells = [];

    var rowNode = tbodyNode.firstElementChild;

    var index = 0;
    while (rowNode) {
      rowNodes.push(rowNode);
      var rowCells = rowNode.querySelectorAll('th, td');
      var dataCell = rowCells[columnIndex];

      var data = {};
      data.index = index;
      data.value = dataCell.getAttribute("csk").toLowerCase().trim();
      if (isNumber) {
        data.value = parseFloat(data.value);
      }
      dataCells.push(data);
      rowNode = rowNode.nextElementSibling;
      index += 1;
    }

    dataCells.sort(compareValues);

    // remove rows
    while (tbodyNode.firstChild) {
      tbodyNode.removeChild(tbodyNode.lastChild);
    }

    // add sorted rows
    for (var i = 0; i < dataCells.length; i += 1) {
      tbodyNode.appendChild(rowNodes[dataCells[i].index]);
    }
/* }}} */
  }

  /* EVENT HANDLERS */

  handleClick(event) {
    var tgt = event.currentTarget;
    this.setColumnHeaderSort(tgt.getAttribute('data-column-index'));
  }

  handleOptionChange(event) {
    var tgt = event.currentTarget;

    if (tgt.checked) {
      this.tableNode.classList.add('show-unsorted-icon');
    } else {
      this.tableNode.classList.remove('show-unsorted-icon');
    }
  }
/* }}} */
}
