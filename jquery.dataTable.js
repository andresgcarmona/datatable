/*
 * 
 */
function econsole(msj, func){
	var f = func || '';
	
	if(msj){
		msj += ' ' + f;
		
		if(console != undefined){
			console.log(msj);
		}
		else if(opera != undefined){
			opera.reportError(msj);
		}
		else{
			alert(msj);
		}
	}
}

/**
 * 
 */
(function($){
	$.fn.dataTable = function(method){
		var args = arguments;
		
		function formatColumnLabel(label){
			var newLabel = label.replace('<br>', ' ');
			return newLabel.replace('<br />', ' ');
		}
		
		return this.each(function(){
			var element = this;
			
			//dtable class
			var dtable = {
				numColumns: 0,
				_data: [],
				currentPage: 1,
				numResults: 10,
				numPages: 1,
				sortColumn: undefined,
				sortOrder: 'desc',
				init: function(){
					this.loadData(function(){
						this.addData();
						this.createSelect();
						this.createButtons();
					});
					
					$('.searchWrapper').width($('.dtableWrapper').find('table').width() - 13);
				},
				parseId: function(id){
					return id.toLowerCase();
				},
				setURL: function(url){
					if(url){
						element.options.source = url;
					}
				},
				getURL: function(){
					return element.options.source.toString();
				},
				reloadData: function(){
					this.loadData(function(){
						this.addData();
					});
				},
				loadData: function(callback, params){
					var self = this,
						source = element.options.source,
						query, column;
	
					$(element).find('tbody').css('opacity', 0.5);
					
					if(params){
						source += params;
					}
					else{
						source += '/nr/' + this.numResults + '/cp/' + this.currentPage;
						
						query = $('#query').val().trim();
						column = $('#columns').val();
						
						if(query){
							source += '/q[]/' + column + '/qv[]/' + query; 
						}
					}
					
					if(this.sortColumn){
						source += '/s/' + this.sortColumn + '/so/' + this.sortOrder;
					}
					
					$.getJSON(source,
					function(data){
						if(toString.call(data.data) === '[object Array]'){
							for(i in data.data){
								data.data[i].formatDate = function(){
									return function(date, render){
										return '<strong>' + render(date) + '</strong>';
									};
								};
							}
						}
						else{
							data.data.formatDate = function(){
								return function(date, render){
									return '<strong>' + render(date) + '</strong>';
								};
							};
						}
						
						self._data = data;
						
						if(callback){
							callback.apply(self);
						}
					});
				},
				addData: function(){
					var toStringF = Object.prototype.toString;
					
					if(toStringF.apply(this._data) == '[object Object]' || (this._data.data !== undefined && toStringF.apply(this._data.data) == '[object Array]'
						&& this._data.data.length > 0)){
						$(element).find('tbody').html(Mustache.render(this.template, {data: this._data}));
					}
					else{
						$(element).find('tbody').html('<tr><td colspan="' + this.numColumns + '">Sin datos</td></tr>');
					}
					
					$(element).find('tbody tr:odd').addClass('odd');
					$(element).find('tbody tr:even').addClass('even');
					$(element).find('tbody tr td').addClass('center');
					
					var numData = this._data.total_filtered,
						numResults = (numData < this.numResults ? this.numResults : this.numResults),
						from = (((this.currentPage * numResults) + 1) - numResults),
						to = this.currentPage * numResults,
						total = this._data.total_filtered;
						
					if(to > total){
						to = to - (to - total); 
					}
						
					var $vista = $(element).find('tfoot tr span');
						$vista.html('Vista ' + from + ' a ' + to + ' de un total de ' + total);
									
					this.updateSelects();
					this.enableButtons();
					
					$(element).trigger('datatable:dataloaded', {data: this._data});
				},
				createSelect: function(){
					var $select = dtable.$searchWrapper.find('form #columns');
					var columns = element.options.columns;
					
					for(var i in columns){
						if(columns[i].searchable === undefined || columns[i].searchable === true){
							$select.append('<option value="' + columns[i].column + '">' + formatColumnLabel(columns[i].label) + '</option>');
						}
					}
				},
				createButtons: function(){
					var dataLength = this._data.total_filtered,
						self = this;
					
					if(dataLength > this.numResults){
						var $pageButtons = $(element).find('tfoot tr .pageButtons'),
							$vista = $(element).find('tfoot tr span'),
							$pageSelect = $(element).find('tfoot tr #numPages');
						
						//Add pages to page selector
						var numPages = parseInt(Math.ceil(dataLength / this.numResults));
						this.numPages = numPages;
						$pageSelect.empty();
						
						for(var i = 1; i <= numPages; i += 1){
							$pageSelect.append('<option value="' + i + '">' + i + '</option>');
						}
						
						$pageButtons.find('#btnNext')
									.prop('disabled', false)
									.removeClass('disabled');
									
						$vista.html('Vista ' + (((this.currentPage * this.numResults) + 1) - this.numResults) + ' a ' + (this.currentPage * this.numResults) + ' de un total de ' + this._data.total_filtered);
									
						$pageButtons.delegate('.button', 'click', function(e){
							var buttonId = $(this).attr('id');
	
							if(buttonId === 'btnNext'){
								self.currentPage += 1;
							}
							else{
								self.currentPage -= 1;
							}
							
							self.loadData(self.addData);
							$pageSelect.val(self.currentPage);
						});
					}
				},
				enableButtons: function(){
					var dataLength = this._data.total_filtered,
						$pageButtons = $(element).find('tfoot tr .pageButtons');
						
					if(this.currentPage >= 1 && this.currentPage < this.numPages){
						$pageButtons.find('#btnNext')
									.prop('disabled', false)
									.removeClass('disabled');
					}
					
					if(this.currentPage > 1 && this.currentPage <= this.numPages){
						$pageButtons.find('#btnPrev')
									.prop('disabled', false)
									.removeClass('disabled');
					}
					
					if(this.currentPage == this.numPages){
						$pageButtons.find('#btnNext')
									.prop('disabled', true)
									.addClass('disabled');
					}
					
					if(this.currentPage == 1){
						$pageButtons.find('#btnPrev')
									.prop('disabled', true)
									.addClass('disabled');
					}
	
					$(element).find('tbody').css('opacity', 1);
				},
				updateSelects: function(){
					var dataLength = this._data.total_filtered,
						self = this;
					
					var $pageButtons = $(element).find('tfoot tr .pageButtons'),
						$vista = $(element).find('tfoot tr span'),
						$pageSelect = $(element).find('tfoot tr #numPages');
					
					//Add pages to page selector
					var numPages = parseInt(Math.ceil(dataLength / this.numResults));
					this.numPages = numPages;
					
					$pageSelect.empty();
					
					for(var i = 1; i <= numPages; i += 1){
						$pageSelect.append('<option value="' + i + '">' + i + '</option>');
					}
					
					//Select page selector option
					if(this.currentPage <= this.numPages){
						$pageSelect.val(this.currentPage);
					}
					else{
						$pageSelect.val(1);
					}
					
					var numData = this._data.total_filtered,
						numResults = (numData < this.numResults ? this.numResults : this.numResults),
						from = (((this.currentPage * numResults) + 1) - numResults),
						to = this.currentPage * numResults,
						total = this._data.total_filtered;
					
					if(to > total){
						to = to - (to - total); 
					}
						
					var $vista = $(element).find('tfoot tr span');
						$vista.html('Vista ' + from + ' a ' + to + ' de un total de ' + total);
				},
				resetPageCounter: function(){
					this.currentPage = 1;
				}
			};
			
			var methods = {
				init: function(options){
					//Create toolbar
					var o = $.extend({
						height: 'auto'
					}, options || {});
					
					//dtable wrapper
					dtable.$dtableWrapper = $('<div class="dtableWrapper">');
	
					//Search div
					if(o.search === undefined || o.search === null || o.search === true){
						dtable.$searchWrapper = $('<div class="searchWrapper">');
						var $searchForm = $('<form onsubmit="return false">'),
							$queryInput = $('<input type="text" name="query" id="query" placeholder="Filtrar búsqueda">'),
							$submit = $('<input type="submit" value="Filtrar" class="button" id="searchButton">'),
							$select = $('<select>');
							$select.attr('id', 'columns');
							
						$searchForm.append($queryInput)
								  .append($submit)
								  .append($select);
	
						dtable.$searchWrapper.append($searchForm);
						dtable.$dtableWrapper.prepend(dtable.$searchWrapper);
						
						$submit.on('click', function(e){
							var query = $('#query').val().trim(),
								params;
							
							if(query){
								params = '/nr/' + dtable.numResults + '/q[]/' + $('#columns').val() + '/qv[]/' + query;
								dtable.loadData(dtable.addData, params);
							}
						});
					}
	
					var $columnsHeaders = $(element).find('thead th');
					dtable.numColumns = $columnsHeaders.length;
					
					$columnsHeaders.each(function(index, element){
						var column = $(element).text();
						$select.append('<option value="' + dtable.parseId(column) + '">' + column + '</option>');
					});
	
					if(o.width){
						dtable.$dtableWrapper.css({
							width: o.width
						});
					}
					
					$(element).after(dtable.$dtableWrapper);
					dtable.$dtableWrapper.append(element);
					
					var $thead = $('<thead><tr></tr></thead>'),
						$tbody = $('<tbody>'),
						$tfoot = $('<tfoot>');
						
					if(o.columns && o.columns.length){
						for(c in o.columns){
							$thead.find('tr').append('<th data-column="' + o.columns[c].column + '">' + o.columns[c].label + '</th>');
							
							if(!o.sortColumn){
								if(c == 0){
									$thead.find('tr th:first-child')
										  .addClass('orderBy')
										  .addClass(dtable.sortOrder.toLowerCase());
								}
							}
							else{
								if(o.columns[c].column === o.sortColumn && o.columns[c].sortable === true){
									$thead.find('tr th[data-column="' + o.columns[c].column + '"]')
										  .addClass('orderBy')
										  .addClass(dtable.sortOrder.toLowerCase());
								}
							}
							
							if(o.columns[c].sortable === true){
								$thead.find('tr th[data-column="' + o.columns[c].column + '"]')
									  .attr('data-sortable', true);
							}
						}
						
						$(element).prepend($thead);
						dtable.numColumns = o.columns.length;
					}
					
					//Delegating events
					$thead.find('tr').delegate('th', 'click', function(e){
						var sortable = $(this).attr('data-sortable'),
							column = $(this).attr('data-column'),
							order = $(this).hasClass('asc') ? 'desc' : 'asc';
						
						if(sortable && Boolean(sortable) === true){
							$thead.find('tr th').removeClass('orderBy asc desc');
							$(this).addClass('orderBy ' + order);
							
							dtable.sortColumn = column;
							dtable.sortOrder = order;
							dtable.loadData(dtable.addData);
						}
					});
					
					$(element).append($tbody);
					$(element).append($tfoot);
					
					$tbody.html('<tr><td colspan="' + dtable.numColumns + '"><img src="/images/progress.gif" class="loading"></td></tr>');
					
					$tfoot.append('<tr><td colspan="' + dtable.numColumns + '"><div id="numResults"><form><span>Vista de 1 de ' + dtable.numResults + '</span></form></div></td></tr>');
					$tfoot.find('tr td').append('<div class="pageButtons"><input type="button" id="btnPrev" disabled value="Anterior" class="disabled button"><input type="button" id="btnNext" disabled value="Siguiente" class="disabled button"></div>');
					
					var $numResultsSelect = $('<select>');
					$numResultsSelect.append('<option value="10">10</option>');
					$numResultsSelect.append('<option value="25">25</option>');
					$numResultsSelect.append('<option value="50">50</option>');
					$numResultsSelect.append('<option value="100">100</option>');
					
					$numResultsSelect.on('change', function(e){
						var val = $(this).val(),
							$numPagesSelect = $('#numPages');
							
						$numPagesSelect.val(1);					
						dtable.currentPage = 1;
						
						dtable.numResults = parseInt(val);
						dtable.loadData(dtable.addData);
					});
					
					$tfoot.find('tr td #numResults form').prepend($numResultsSelect);
					
					var $numPagesSelect = $('<select id="numPages">');
					$numPagesSelect.append('<option value="1" selected="selected">1</option>');
					
					$numPagesSelect.on('change', function(e){
						var val = $(this).val();
						
						dtable.currentPage = parseInt(val);
						dtable.loadData(dtable.addData);
					});
					
					$tfoot.find('tr td #numResults form').append($numPagesSelect);
					
					//Set sort column
					if(o.sortColumn){
						dtable.sortColumn = o.sortColumn;
					}
					else{
						dtable.sortColumn = o.columns[0].column;
					}
					
					if(o.sortOrder){
						dtable.sortOrder = o.sortOrder;
					}
					
					if(o.template){
						var self = this;
						requirejs(['text!' + o.template], function(template){
							dtable.template = template;
							if(o.source){
								dtable.init();
							}
						});
					}
					
					//Query input
					$('#query').on('keyup', function(e){
						if($(this).val() === ''){
							dtable.loadData(dtable.addData);
						}
					});
					
					//Make options and dtable accessible from outside
					element.options = o;
					element.dtable = dtable;
					
					return element;
				},
				show: function(){
					
				},
				hide: function(){
					
				},
				reload: function(){
					element.dtable.reloadData();
				},
				setURL: function(url){
					element.dtable.setURL(url);
					element.dtable.resetPageCounter();
				},
				getURL: function(){
					console.log(element.dtable.getURL());
					return element.dtable.getURL();
				}
			};
			
		    if(methods[method]){
		    	return methods[method].apply(this, Array.prototype.slice.call(args, 1));
		    }
		    else if(typeof method === 'object' || !method){
		    	return methods.init.apply(this, args);
		    }
		    else{
		    	$.error(function(){
		    		econsole('Method error.');
		    	});
		    }
		});
	};
})(jQuery);
