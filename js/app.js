const e = React.createElement;
const { useState, useEffect, useMemo, useCallback, useRef } = React;

const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => {
  if (!d) return '\u2014';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const catClass = (c) => {
  if (c === 'Food') return 'cat-food';
  if (c === 'Beer & Wine') return 'cat-beer';
  if (c === 'Paper & Supplies') return 'cat-paper';
  if (c === 'Merchandise') return 'cat-merch';
  return '';
};

const CAT_COLORS = { 'Food': '#E85D4A', 'Paper & Supplies': '#F59E0B', 'Merchandise': '#10B981', 'Beer & Wine': '#3B82F6' };
const SUPPLIERS = ['Sysco','Gordon Foods','U S Foods','Marks','BJs','RTI','Uline','Staples','Pepsi','Cape Fish','Henny Penny','HT Berry','Lou Knife','Martinetti','Colonial','Lamarca','Northcoast','Amazon','RAW SEAFO','CCP'];

// SVG Icons as functions
const SearchIcon = () => e('svg', {width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'white',strokeWidth:2}, e('circle',{cx:11,cy:11,r:8}), e('path',{d:'m21 21-4.35-4.35'}));
const DownloadIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('path',{d:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'}), e('polyline',{points:'7 10 12 15 17 10'}), e('line',{x1:12,y1:15,x2:12,y2:3}));
const PlusIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.5}, e('line',{x1:12,y1:5,x2:12,y2:19}), e('line',{x1:5,y1:12,x2:19,y2:12}));
const EditIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('path',{d:'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'}), e('path',{d:'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'}));
const TrashIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('polyline',{points:'3 6 5 6 21 6'}), e('path',{d:'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'}));

// Pie Chart
function PieChart(props) {
  const data = props.data;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  let cum = 0;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const startAngle = cum * 2 * Math.PI;
    cum += pct;
    const endAngle = cum * 2 * Math.PI;
    const largeArc = pct > 0.5 ? 1 : 0;
    const x1 = 100 + 80 * Math.cos(startAngle - Math.PI/2);
    const y1 = 100 + 80 * Math.sin(startAngle - Math.PI/2);
    const x2 = 100 + 80 * Math.cos(endAngle - Math.PI/2);
    const y2 = 100 + 80 * Math.sin(endAngle - Math.PI/2);
    const path = 'M 100 100 L '+x1+' '+y1+' A 80 80 0 '+largeArc+' 1 '+x2+' '+y2+' Z';
    return e('path', {key:i, d:path, fill:d.color, stroke:'white', strokeWidth:2});
  });
  return e('div', {className:'pie-container'}, e('svg', {width:200,height:200,viewBox:'0 0 200 200'}, ...slices));
}

// Modal
function Modal(props) {
  return e('div', {className:'modal-overlay', onClick:props.onClose},
    e('div', {className:'modal', onClick:ev=>ev.stopPropagation()},
      e('div', {className:'modal-header'},
        e('h2', null, props.title),
        e('button', {className:'modal-close', onClick:props.onClose}, '\u00d7')
      ),
      e('div', {className:'modal-body'}, props.children),
      props.footer && e('div', {className:'modal-footer'}, props.footer)
    )
  );
}

// Toast
function Toast(props) {
  useEffect(() => { const t = setTimeout(props.onDone, 3000); return () => clearTimeout(t); }, []);
  return e('div', {className:'toast '+props.type}, '\u2713 ' + props.message);
}

// Food Cost Calculator
function FoodCostCalc(props) {
  const [beginningInv, setBeginningInv] = useState('51365.00');
  const [purchases, setPurchases] = useState('0.00');
  const endingInv = props.items.reduce((s, i) => s + i.totalValue, 0);
  const bi = parseFloat(beginningInv) || 0;
  const pu = parseFloat(purchases) || 0;
  const cogs = bi + pu - endingInv;

  return e('div', {className:'food-cost-grid'},
    e('div', null,
      e('div', {className:'cost-row'},
        e('span', {className:'cost-label'}, 'Beginning Inventory'),
        e('span', {className:'cost-val'}, e('input', {type:'number',className:'form-input',style:{width:140,textAlign:'right',fontWeight:700,fontSize:15},value:beginningInv,onChange:ev=>setBeginningInv(ev.target.value)}))
      ),
      e('div', {className:'cost-row'},
        e('span', {className:'cost-label'}, '+ Total Purchases'),
        e('span', {className:'cost-val'}, e('input', {type:'number',className:'form-input',style:{width:140,textAlign:'right',fontWeight:700,fontSize:15},value:purchases,onChange:ev=>setPurchases(ev.target.value)}))
      ),
      e('div', {className:'cost-row'},
        e('span', {className:'cost-label'}, '= Available for Sale'),
        e('span', {className:'cost-val'}, fmt(bi + pu))
      ),
      e('div', {className:'cost-row'},
        e('span', {className:'cost-label'}, '\u2212 Ending Inventory'),
        e('span', {className:'cost-val'}, fmt(endingInv))
      ),
      e('div', {className:'cost-row total'},
        e('span', {className:'cost-label', style:{fontWeight:700,fontSize:16}}, 'Cost of Goods Sold'),
        e('span', {className:'cost-val', style:{color:'var(--coral)'}}, fmt(cogs))
      )
    ),
    e('div', null,
      e('div', {style:{background:'var(--gray-50)',borderRadius:'var(--radius)',padding:24,textAlign:'center'}},
        e('div', {style:{fontSize:12,color:'var(--gray-500)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}, 'Current Ending Inventory'),
        e('div', {style:{fontFamily:"'Playfair Display', serif",fontSize:36,fontWeight:800,color:'var(--ocean-deep)'}}, fmt(endingInv)),
        e('div', {style:{marginTop:20}},
          Object.entries(props.categories).sort((a,b) => b[1].value - a[1].value).map(function(entry) {
            return e('div', {key:entry[0], style:{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13}},
              e('span', {style:{color:'var(--gray-500)'}}, entry[0]),
              e('span', {style:{fontWeight:600}}, fmt(entry[1].value))
            );
          })
        )
      )
    )
  );
}

// ──── Main App ────
function App() {
  const [items, setItems] = useState(window.INITIAL_DATA || []);
  const [page, setPage] = useState('track');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [tablePage, setTablePage] = useState(1);
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [changes, setChanges] = useState({});
  const [newItem, setNewItem] = useState({name:'',itemNumber:'',category:'Food',location:'Cellar',quantity:0,quantityUnit:'CS',price:0,priceUnit:'CS'});
  const perPage = 50;

  const locations = useMemo(function() {
    var locs = {};
    items.forEach(function(item) {
      if (!locs[item.location]) locs[item.location] = {count:0,value:0};
      locs[item.location].count++;
      locs[item.location].value += item.totalValue;
    });
    return locs;
  }, [items]);

  const categories = useMemo(function() {
    var cats = {};
    items.forEach(function(item) {
      if (!cats[item.category]) cats[item.category] = {count:0,value:0};
      cats[item.category].count++;
      cats[item.category].value += item.totalValue;
    });
    return cats;
  }, [items]);

  const totalValue = useMemo(function() { return items.reduce(function(s,i){return s+i.totalValue;},0); }, [items]);
  const allLocations = useMemo(function() { return [...new Set(items.map(function(i){return i.location;}))].sort(); }, [items]);
  const allCategories = useMemo(function() { return [...new Set(items.map(function(i){return i.category;}))].sort(); }, [items]);

  const filtered = useMemo(function() {
    var result = items.slice();
    if (search) {
      var q = search.toLowerCase();
      result = result.filter(function(i) {
        return i.name.toLowerCase().includes(q) || i.itemNumber.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.location.toLowerCase().includes(q);
      });
    }
    if (locationFilter !== 'All') result = result.filter(function(i){return i.location === locationFilter;});
    if (categoryFilter !== 'All') result = result.filter(function(i){return i.category === categoryFilter;});
    result.sort(function(a, b) {
      var va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [items, search, locationFilter, categoryFilter, sortField, sortDir]);

  const pageCount = Math.ceil(filtered.length / perPage);
  const pageItems = filtered.slice((tablePage - 1) * perPage, tablePage * perPage);
  const hasChanges = Object.keys(changes).length > 0;

  var handleSort = function(field) {
    if (sortField === field) setSortDir(function(d){return d==='asc'?'desc':'asc';});
    else { setSortField(field); setSortDir('asc'); }
  };

  var sortIcon = function(field) {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' \u25b2' : ' \u25bc';
  };

  var updateQuantity = function(id, newQty) {
    var q = parseFloat(newQty);
    if (isNaN(q) || q < 0) return;
    setChanges(function(c) { var n = Object.assign({}, c); n[id] = q; return n; });
  };

  var saveChanges = function() {
    setItems(function(prev) { return prev.map(function(item) {
      if (changes[item.id] !== undefined) {
        var newQty = changes[item.id];
        return Object.assign({}, item, {quantity:newQty, totalValue:Math.round(newQty*item.price*100)/100, lastCounted:new Date().toISOString().split('T')[0]});
      }
      return item;
    }); });
    var count = Object.keys(changes).length;
    setChanges({});
    setToast({message:count+' item(s) updated', type:'success'});
  };

  var discardChanges = function() { setChanges({}); };

  var addItem = function() {
    var item = Object.assign({id:Math.max.apply(null,items.map(function(i){return i.id;}))+1}, newItem, {
      quantity:parseFloat(newItem.quantity)||0, price:parseFloat(newItem.price)||0,
      totalValue:(parseFloat(newItem.quantity)||0)*(parseFloat(newItem.price)||0),
      lastCounted:new Date().toISOString().split('T')[0]
    });
    setItems(function(prev){return prev.concat([item]);});
    setModal(null);
    setNewItem({name:'',itemNumber:'',category:'Food',location:'Cellar',quantity:0,quantityUnit:'CS',price:0,priceUnit:'CS'});
    setToast({message:'"'+item.name+'" added', type:'success'});
  };

  var saveEdit = function() {
    setItems(function(prev){return prev.map(function(i){
      if (i.id === editItem.id) {
        var qty = parseFloat(editItem.quantity)||0;
        var price = parseFloat(editItem.price)||0;
        return Object.assign({}, editItem, {quantity:qty, price:price, totalValue:Math.round(qty*price*100)/100});
      }
      return i;
    });});
    setModal(null); setEditItem(null);
    setToast({message:'Item updated', type:'success'});
  };

  var deleteItem = function(id) {
    if (!confirm('Delete this item?')) return;
    var item = items.find(function(i){return i.id===id;});
    setItems(function(prev){return prev.filter(function(i){return i.id!==id;});});
    setToast({message:'"'+(item?item.name:'')+'" deleted', type:'warning'});
  };

  var closeInventory = function() {
    var now = new Date().toISOString().split('T')[0];
    setItems(function(prev){return prev.map(function(i){return Object.assign({},i,{lastCounted:now});});});
    setToast({message:'Inventory closed for '+fmtDate(now), type:'success'});
  };

  var exportCSV = function() {
    var headers = ['Category','Item Number','Name','Location','Quantity','Unit','Price','Price Unit','Total Value','Last Counted'];
    var rows = items.map(function(i){return [i.category,i.itemNumber,i.name,i.location,i.quantity,i.quantityUnit,i.price,i.priceUnit,i.totalValue,i.lastCounted];});
    var csv = [headers].concat(rows).map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'SeafoodSams_Inventory_'+new Date().toISOString().split('T')[0]+'.csv';
    a.click();
    setToast({message:'Inventory exported', type:'success'});
  };

  // Helper to build form group
  var fg = function(label, input) {
    return e('div', {className:'form-group'}, e('label', null, label), input);
  };

  // ──── RENDER ────
  return e('div', null,
    // Header
    e('header', {className:'app-header'},
      e('div', {className:'header-main'},
        e('div', {className:'brand'},
          e('div', {className:'brand-icon'}, '\ud83e\udde1'),
          e('div', {className:'brand-text'},
            e('h1', null, "Seafood Sam's"),
            e('span', null, 'Falmouth, MA \u2014 Inventory')
          )
        ),
        e('div', {className:'header-search'},
          e(SearchIcon),
          e('input', {type:'text', placeholder:'Search items, categories, locations...', value:search, onChange:function(ev){setSearch(ev.target.value);setTablePage(1);}})
        ),
        e('div', {className:'header-actions'},
          e('button', {className:'btn btn-ghost', onClick:exportCSV}, e(DownloadIcon), ' Export'),
          e('button', {className:'btn btn-primary', onClick:function(){setModal('add');}}, e(PlusIcon), ' Add Item')
        )
      ),
      e('nav', {className:'nav-tabs'},
        ['track','summary','food-cost','manage'].map(function(t) {
          var label = t==='track'?'Track Inventory':t==='summary'?'Summary':t==='food-cost'?'Food Cost':'Manage';
          return e('button', {key:t, className:'nav-tab '+(page===t?'active':''), onClick:function(){setPage(t);}}, label);
        })
      )
    ),

    e('div', {className:'main-content'},

      // ──── TRACK PAGE ────
      page === 'track' && e(React.Fragment, null,
        // Stats
        e('div', {className:'dashboard-grid'},
          e('div', {className:'stat-card accent'},
            e('div', {className:'label'}, 'Total Inventory Value'),
            e('div', {className:'value'}, fmt(totalValue)),
            e('div', {className:'sub'}, items.length + ' items tracked')
          ),
          e('div', {className:'stat-card'},
            e('div', {className:'label'}, 'Locations'),
            e('div', {className:'value'}, Object.keys(locations).length),
            e('div', {className:'sub'}, 'storage areas')
          ),
          e('div', {className:'stat-card'},
            e('div', {className:'label'}, 'Categories'),
            e('div', {className:'value'}, Object.keys(categories).length),
            e('div', {className:'sub'}, 'expense types')
          ),
          e('div', {className:'stat-card warn'},
            e('div', {className:'label'}, 'Zero Stock Items'),
            e('div', {className:'value'}, items.filter(function(i){return i.quantity===0;}).length),
            e('div', {className:'sub'}, 'need recount or restock')
          )
        ),
        // Location chips
        e('div', {className:'location-bar'},
          e('button', {className:'loc-chip '+(locationFilter==='All'?'active':''), onClick:function(){setLocationFilter('All');setTablePage(1);}},
            'All Locations ', e('span', {className:'count'}, items.length)
          ),
          allLocations.map(function(loc) {
            return e('button', {key:loc, className:'loc-chip '+(locationFilter===loc?'active':''), onClick:function(){setLocationFilter(loc);setTablePage(1);}},
              loc, ' ', e('span', {className:'count'}, (locations[loc]||{}).count||0)
            );
          })
        ),
        // Table
        e('div', {className:'table-container'},
          e('div', {className:'table-header'},
            e('h2', null, 'Inventory Items ('+filtered.length+')'),
            e('div', {className:'filter-row'},
              e('select', {className:'filter-select', value:categoryFilter, onChange:function(ev){setCategoryFilter(ev.target.value);setTablePage(1);}},
                e('option', {value:'All'}, 'All Categories'),
                allCategories.map(function(c){return e('option', {key:c, value:c}, c);})
              )
            )
          ),
          e('div', {style:{overflowX:'auto'}},
            e('table', null,
              e('thead', null,
                e('tr', null,
                  e('th', {onClick:function(){handleSort('name');}}, 'Item'+sortIcon('name')),
                  e('th', {onClick:function(){handleSort('category');}}, 'Category'+sortIcon('category')),
                  e('th', {onClick:function(){handleSort('location');}}, 'Location'+sortIcon('location')),
                  e('th', {onClick:function(){handleSort('quantity');}}, 'Qty on Hand'+sortIcon('quantity')),
                  e('th', {onClick:function(){handleSort('price');}}, 'Price'+sortIcon('price')),
                  e('th', {onClick:function(){handleSort('totalValue');}}, 'Value'+sortIcon('totalValue')),
                  e('th', {onClick:function(){handleSort('lastCounted');}}, 'Last Counted'+sortIcon('lastCounted')),
                  e('th', {style:{width:60}})
                )
              ),
              e('tbody', null,
                pageItems.length === 0 ?
                  e('tr', null, e('td', {colSpan:8}, e('div', {className:'empty-state'}, e('h3', null, 'No items found'), e('p', null, 'Try adjusting your search or filters'))))
                :
                pageItems.map(function(item) {
                  var currentQty = changes[item.id] !== undefined ? changes[item.id] : item.quantity;
                  var currentVal = changes[item.id] !== undefined ? Math.round(changes[item.id]*item.price*100)/100 : item.totalValue;
                  return e('tr', {key:item.id},
                    e('td', null,
                      e('div', {className:'item-name'}, item.name),
                      e('div', {className:'item-id'}, item.itemNumber)
                    ),
                    e('td', null, e('span', {className:'category-badge '+catClass(item.category)}, item.category)),
                    e('td', {style:{fontSize:12,color:'var(--gray-500)'}}, item.location),
                    e('td', null,
                      e('div', {className:'qty-cell'},
                        e('input', {type:'number', className:'qty-input '+(changes[item.id]!==undefined?'changed':''), value:currentQty, onChange:function(ev){updateQuantity(item.id,ev.target.value);}, min:0, step:0.5}),
                        e('span', {className:'qty-unit'}, item.quantityUnit)
                      )
                    ),
                    e('td', {className:'price-cell'}, fmt(item.price), e('span', {style:{fontSize:10,color:'var(--gray-400)'}}, '/'+item.priceUnit)),
                    e('td', {className:'value-cell'}, fmt(currentVal)),
                    e('td', {className:'date-cell'}, fmtDate(item.lastCounted)),
                    e('td', null,
                      e('div', {style:{display:'flex',gap:2}},
                        e('button', {className:'icon-btn', title:'Edit', onClick:function(){setEditItem(Object.assign({},item));setModal('edit');}}, e(EditIcon)),
                        e('button', {className:'icon-btn danger', title:'Delete', onClick:function(){deleteItem(item.id);}}, e(TrashIcon))
                      )
                    )
                  );
                })
              )
            )
          ),
          pageCount > 1 && e('div', {className:'pagination'},
            e('span', null, 'Showing '+((tablePage-1)*perPage+1)+'\u2013'+Math.min(tablePage*perPage, filtered.length)+' of '+filtered.length),
            e('div', {className:'page-btns'},
              e('button', {className:'page-btn', disabled:tablePage===1, onClick:function(){setTablePage(function(p){return p-1;});}}, '\u2190 Prev'),
              Array.from({length:Math.min(pageCount,7)}, function(_,i) {
                var p;
                if (pageCount<=7) p=i+1;
                else if (tablePage<=4) p=i+1;
                else if (tablePage>=pageCount-3) p=pageCount-6+i;
                else p=tablePage-3+i;
                return e('button', {key:p, className:'page-btn '+(tablePage===p?'active':''), onClick:function(){setTablePage(p);}}, p);
              }),
              e('button', {className:'page-btn', disabled:tablePage===pageCount, onClick:function(){setTablePage(function(p){return p+1;});}}, 'Next \u2192')
            )
          )
        )
      ),

      // ──── SUMMARY PAGE ────
      page === 'summary' && e(React.Fragment, null,
        e('div', {className:'dashboard-grid'},
          e('div', {className:'stat-card accent'},
            e('div', {className:'label'}, 'Total Inventory'),
            e('div', {className:'value'}, fmt(totalValue)),
            e('div', {className:'sub'}, 'across '+items.length+' items')
          ),
          allCategories.map(function(cat) {
            return e('div', {key:cat, className:'stat-card'},
              e('div', {className:'label'}, cat),
              e('div', {className:'value'}, fmt((categories[cat]||{}).value||0)),
              e('div', {className:'sub'}, ((categories[cat]||{}).count||0)+' items \u00b7 '+(totalValue>0?Math.round(((categories[cat]||{}).value||0)/totalValue*100):0)+'%')
            );
          })
        ),
        e('div', {className:'summary-section'},
          e('h2', null, 'Inventory Value by Category'),
          e(PieChart, {data:allCategories.map(function(cat){return {label:cat,value:(categories[cat]||{}).value||0,color:CAT_COLORS[cat]||'#999'};})}),
          e('div', {className:'pie-legend'},
            allCategories.map(function(cat) {
              return e('div', {key:cat, className:'legend-item'},
                e('div', {className:'legend-dot', style:{background:CAT_COLORS[cat]||'#999'}}),
                e('div', {className:'legend-info'},
                  e('div', {className:'legend-label'}, cat),
                  e('div', {className:'legend-value'}, fmt((categories[cat]||{}).value||0)),
                  e('div', {className:'legend-pct'}, (totalValue>0?Math.round(((categories[cat]||{}).value||0)/totalValue*100):0)+'% \u00b7 '+((categories[cat]||{}).count||0)+' items')
                )
              );
            })
          )
        ),
        e('div', {className:'summary-section'},
          e('h2', null, 'Value by Location'),
          e('div', {className:'pie-legend'},
            Object.entries(locations).sort(function(a,b){return b[1].value-a[1].value;}).map(function(entry, idx) {
              var hues = [210,30,150,340,60,190,270,120,15,240,90,300,45];
              return e('div', {key:entry[0], className:'legend-item'},
                e('div', {className:'legend-dot', style:{background:'hsl('+hues[idx%hues.length]+', 55%, 50%)'}}),
                e('div', {className:'legend-info'},
                  e('div', {className:'legend-label'}, entry[0]),
                  e('div', {className:'legend-value'}, fmt(entry[1].value)),
                  e('div', {className:'legend-pct'}, entry[1].count+' items')
                )
              );
            })
          )
        ),
        e('div', {style:{textAlign:'center',padding:'20px'}},
          e('button', {className:'btn btn-primary', style:{padding:'14px 32px',fontSize:15}, onClick:closeInventory}, 'Close Inventory Period'),
          e('p', {style:{fontSize:12,color:'var(--gray-400)',marginTop:8}}, 'Last closed: '+(items[0]?fmtDate(items[0].lastCounted):'\u2014'))
        )
      ),

      // ──── FOOD COST PAGE ────
      page === 'food-cost' && e('div', {className:'summary-section'},
        e('h2', null, 'Food Cost Calculator'),
        e('p', {style:{color:'var(--gray-500)',fontSize:13,marginBottom:20}}, 'Calculates cost of goods sold based on beginning inventory, purchases, and ending inventory.'),
        e(FoodCostCalc, {items:items, categories:categories})
      ),

      // ──── MANAGE PAGE ────
      page === 'manage' && e('div', {className:'manage-grid'},
        e('div', {className:'manage-card'},
          e('div', {className:'manage-card-header'}, e('h3', null, '\ud83d\udcc2 Expense Categories'), e('span', {style:{fontSize:12,color:'var(--gray-400)'}}, allCategories.length)),
          e('div', {className:'manage-list'},
            allCategories.map(function(cat){
              return e('div', {key:cat, className:'manage-list-item'}, e('span',null,cat), e('span',{className:'item-count'},((categories[cat]||{}).count||0)+' items'));
            })
          )
        ),
        e('div', {className:'manage-card'},
          e('div', {className:'manage-card-header'}, e('h3', null, '\ud83d\udccd Locations'), e('span', {style:{fontSize:12,color:'var(--gray-400)'}}, allLocations.length)),
          e('div', {className:'manage-list'},
            allLocations.map(function(loc){
              return e('div', {key:loc, className:'manage-list-item'}, e('span',null,loc), e('span',{className:'item-count'},((locations[loc]||{}).count||0)+' items \u00b7 '+fmt((locations[loc]||{}).value||0)));
            })
          )
        ),
        e('div', {className:'manage-card'},
          e('div', {className:'manage-card-header'}, e('h3', null, '\ud83d\ude9b Suppliers'), e('span', {style:{fontSize:12,color:'var(--gray-400)'}}, SUPPLIERS.length)),
          e('div', {className:'manage-list'},
            SUPPLIERS.slice().sort().map(function(s){
              return e('div', {key:s, className:'manage-list-item'}, e('span',null,s));
            })
          )
        ),
        e('div', {className:'manage-card'},
          e('div', {className:'manage-card-header'}, e('h3', null, '\ud83d\udcca Quick Stats')),
          e('div', {className:'manage-list'},
            e('div', {className:'manage-list-item'}, e('span',null,'Total Items'), e('span',{className:'item-count'},items.length)),
            e('div', {className:'manage-list-item'}, e('span',null,'Total Value'), e('span',{className:'item-count'},fmt(totalValue))),
            e('div', {className:'manage-list-item'}, e('span',null,'Zero Stock'), e('span',{className:'item-count'},items.filter(function(i){return i.quantity===0;}).length)),
            e('div', {className:'manage-list-item'}, e('span',null,'Avg Item Value'), e('span',{className:'item-count'},fmt(totalValue/items.length))),
            e('div', {className:'manage-list-item'}, e('span',null,'Highest Value Item'), e('span',{className:'item-count'},items.reduce(function(m,i){return i.totalValue>m.totalValue?i:m;},items[0]).name))
          )
        )
      )
    ),

    // Unsaved changes bar
    hasChanges && e('div', {className:'unsaved-bar'},
      e('div', {className:'info'}, e('strong', null, Object.keys(changes).length+' unsaved change(s)'), ' \u2014 Quantity updates pending'),
      e('div', {className:'actions'},
        e('button', {className:'btn btn-ghost', onClick:discardChanges}, 'Discard'),
        e('button', {className:'btn btn-primary', onClick:saveChanges}, 'Save All Changes')
      )
    ),

    // Add Item Modal
    modal === 'add' && e(Modal, {title:'Add New Item', onClose:function(){setModal(null);},
      footer: e(React.Fragment, null,
        e('button', {className:'btn btn-outline', onClick:function(){setModal(null);}}, 'Cancel'),
        e('button', {className:'btn btn-primary', onClick:addItem, disabled:!newItem.name}, 'Add Item')
      )},
      fg('Item Name', e('input', {className:'form-input', value:newItem.name, onChange:function(ev){setNewItem(function(n){return Object.assign({},n,{name:ev.target.value});});}, placeholder:'e.g., Cod Fillets (Case)'})),
      e('div', {className:'form-row'},
        fg('Item Number / ID', e('input', {className:'form-input', value:newItem.itemNumber, onChange:function(ev){setNewItem(function(n){return Object.assign({},n,{itemNumber:ev.target.value});});}, placeholder:'e.g., Sys12345'})),
        fg('Category', e('select', {className:'form-input', value:newItem.category, onChange:function(ev){setNewItem(function(n){return Object.assign({},n,{category:ev.target.value});});}}, allCategories.map(function(c){return e('option',{key:c,value:c},c);})))
      ),
      fg('Location', e('select', {className:'form-input', value:newItem.location, onChange:function(ev){setNewItem(function(n){return Object.assign({},n,{location:ev.target.value});});}}, allLocations.map(function(l){return e('option',{key:l,value:l},l);}))),
      e('div', {className:'form-row'},
        fg('Quantity on Hand', e('input', {className:'form-input', type:'number', min:0, step:0.5, value:newItem.quantity, onChange:function(ev){setNewItem(function(n){return Object.assign({},n,{quantity:ev.target.value});});}})),
        fg('Quantity Unit', e('select', {className:'form-input', value:newItem.quantityUnit, onChange:function(ev){setNewItem(function(n){return Object.assign({},n,{quantityUnit:ev.target.value});});}}, e('option',{value:'CS'},'CS (Case)'), e('option',{value:'PK'},'PK (Pack)'), e('option',{value:'LB'},'LB (Pound)')))
      ),
      e('div', {className:'form-row'},
        fg('Price', e('input', {className:'form-input', type:'number', min:0, step:0.01, value:newItem.price, onChange:function(ev){setNewItem(function(n){return Object.assign({},n,{price:ev.target.value});});}})),
        fg('Price Unit', e('select', {className:'form-input', value:newItem.priceUnit, onChange:function(ev){setNewItem(function(n){return Object.assign({},n,{priceUnit:ev.target.value});});}}, e('option',{value:'CS'},'CS (Case)'), e('option',{value:'PK'},'PK (Pack)'), e('option',{value:'LB'},'LB (Pound)')))
      )
    ),

    // Edit Item Modal
    modal === 'edit' && editItem && e(Modal, {title:'Edit Item', onClose:function(){setModal(null);setEditItem(null);},
      footer: e(React.Fragment, null,
        e('button', {className:'btn btn-outline', onClick:function(){setModal(null);setEditItem(null);}}, 'Cancel'),
        e('button', {className:'btn btn-primary', onClick:saveEdit}, 'Save Changes')
      )},
      fg('Item Name', e('input', {className:'form-input', value:editItem.name, onChange:function(ev){setEditItem(function(n){return Object.assign({},n,{name:ev.target.value});});}})),
      e('div', {className:'form-row'},
        fg('Item Number', e('input', {className:'form-input', value:editItem.itemNumber, onChange:function(ev){setEditItem(function(n){return Object.assign({},n,{itemNumber:ev.target.value});});}})),
        fg('Category', e('select', {className:'form-input', value:editItem.category, onChange:function(ev){setEditItem(function(n){return Object.assign({},n,{category:ev.target.value});});}}, allCategories.map(function(c){return e('option',{key:c,value:c},c);})))
      ),
      fg('Location', e('select', {className:'form-input', value:editItem.location, onChange:function(ev){setEditItem(function(n){return Object.assign({},n,{location:ev.target.value});});}}, allLocations.map(function(l){return e('option',{key:l,value:l},l);}))),
      e('div', {className:'form-row'},
        fg('Quantity on Hand', e('input', {className:'form-input', type:'number', min:0, step:0.5, value:editItem.quantity, onChange:function(ev){setEditItem(function(n){return Object.assign({},n,{quantity:ev.target.value});});}})),
        fg('Unit', e('select', {className:'form-input', value:editItem.quantityUnit, onChange:function(ev){setEditItem(function(n){return Object.assign({},n,{quantityUnit:ev.target.value});});}}, e('option',{value:'CS'},'CS'), e('option',{value:'PK'},'PK'), e('option',{value:'LB'},'LB')))
      ),
      e('div', {className:'form-row'},
        fg('Price', e('input', {className:'form-input', type:'number', min:0, step:0.01, value:editItem.price, onChange:function(ev){setEditItem(function(n){return Object.assign({},n,{price:ev.target.value});});}})),
        fg('Price Unit', e('select', {className:'form-input', value:editItem.priceUnit, onChange:function(ev){setEditItem(function(n){return Object.assign({},n,{priceUnit:ev.target.value});});}}, e('option',{value:'CS'},'CS'), e('option',{value:'PK'},'PK'), e('option',{value:'LB'},'LB')))
      )
    ),

    // Toast
    toast && e(Toast, {message:toast.message, type:toast.type, onDone:function(){setToast(null);}})
  );
}

ReactDOM.render(e(App), document.getElementById('root'));