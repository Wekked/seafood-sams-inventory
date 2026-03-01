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

// ──── User Accounts ────
// Users are now managed via Supabase Auth + profiles table.
// The DEFAULT_USERS array is kept as a fallback if Supabase is not configured.
var DEFAULT_USERS = [
  { username: 'admin', password: 'seafoodsams', displayName: 'Admin', role: 'admin' },
  { username: 'manager', password: 'falmouth1', displayName: 'Manager', role: 'manager' },
  { username: 'staff', password: 'inventory1', displayName: 'Staff', role: 'staff' }
];

// Check if Supabase is configured (not still using placeholder)
var SUPABASE_CONFIGURED = typeof window.SupaDB !== 'undefined' &&
  typeof SUPABASE_URL !== 'undefined' &&
  SUPABASE_URL.indexOf('YOUR_PROJECT_ID') === -1;

// SVG Icons as functions
const UserIcon = () => e('svg', {width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('path',{d:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'}), e('circle',{cx:12,cy:7,r:4}));
const LockIcon = () => e('svg', {width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('rect',{x:3,y:11,width:18,height:11,rx:2,ry:2}), e('path',{d:'M7 11V7a5 5 0 0 1 10 0v4'}));
const EyeIcon = () => e('svg', {width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('path',{d:'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'}), e('circle',{cx:12,cy:12,r:3}));
const EyeOffIcon = () => e('svg', {width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('path',{d:'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24'}), e('line',{x1:1,y1:1,x2:23,y2:23}));
const LogoutIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('path',{d:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'}), e('polyline',{points:'16 17 21 12 16 7'}), e('line',{x1:21,y1:12,x2:9,y2:12}));
const AlertCircleIcon = () => e('svg', {width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('circle',{cx:12,cy:12,r:10}), e('line',{x1:12,y1:8,x2:12,y2:12}), e('line',{x1:12,y1:16,x2:12.01,y2:16}));

// ──── Login Page Component ────
function LoginPage(props) {
  var onLogin = props.onLogin;
  var _username = useState('');
  var username = _username[0]; var setUsername = _username[1];
  var _password = useState('');
  var password = _password[0]; var setPassword = _password[1];
  var _error = useState('');
  var error = _error[0]; var setError = _error[1];
  var _loading = useState(false);
  var loading = _loading[0]; var setLoading = _loading[1];
  var _showPw = useState(false);
  var showPw = _showPw[0]; var setShowPw = _showPw[1];

  var handleSubmit = function(ev) {
    if (ev) ev.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);

    if (SUPABASE_CONFIGURED) {
      // ──── Supabase Auth ────
      SupaAuth.signIn(username.trim(), password).then(function(result) {
        if (result.error) {
          setError(result.error.message || 'Invalid credentials.');
          setLoading(false);
          return;
        }
        var user = result.data.user;
        // Fetch profile for display name and role
        SupaAuth.getProfile(user.id).then(function(profileResult) {
          var profile = profileResult.data;
          onLogin({
            id: user.id,
            username: user.email,
            displayName: profile ? profile.display_name : user.email.split('@')[0],
            role: profile ? profile.role : 'staff',
            supabaseUser: true
          });
        });
      });
    } else {
      // ──── Fallback local auth ────
      setTimeout(function() {
        var user = DEFAULT_USERS.find(function(u) {
          return u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password;
        });
        if (user) {
          onLogin({ username: user.username, displayName: user.displayName, role: user.role, supabaseUser: false });
        } else {
          setError('Invalid username or password.');
          setLoading(false);
        }
      }, 800);
    }
  };

  var handleKeyDown = function(ev) {
    if (ev.key === 'Enter') handleSubmit();
  };

  // Wave SVG path
  var wavePath = 'M0,64 C160,100 320,20 480,64 C640,108 800,28 960,64 C1120,100 1280,20 1440,64 L1440,200 L0,200 Z';

  return e('div', {className: 'login-page'},
    // Animated waves
    e('div', {className: 'login-waves'},
      e('svg', {className: 'login-wave-1', viewBox: '0 0 1440 200', preserveAspectRatio: 'none'},
        e('path', {d: wavePath, fill: 'white'})
      ),
      e('svg', {className: 'login-wave-2', viewBox: '0 0 1440 200', preserveAspectRatio: 'none', style: {bottom: -20}},
        e('path', {d: 'M0,80 C200,40 400,120 600,80 C800,40 1000,120 1200,80 C1300,60 1400,100 1440,80 L1440,200 L0,200 Z', fill: 'white'})
      )
    ),

    // Login card
    e('div', {className: 'login-card'},
      // Top section with branding
      e('div', {className: 'login-card-top'},
        e('div', {className: 'login-logo'}, '🦞'),
        e('h1', null, "Seafood Sam's"),
        e('div', {className: 'subtitle'}, 'Falmouth, MA')
      ),

      // Form body
      e('div', {className: 'login-card-body'},
        e('div', {className: 'login-welcome'},
          e('h2', null, 'Welcome Back'),
          e('p', null, 'Sign in to manage your inventory')
        ),

        // Error message
        error && e('div', {className: 'login-error-msg'},
          e(AlertCircleIcon),
          error
        ),

        // Username field
        e('div', {className: 'login-form-group'},
          e('label', null, SUPABASE_CONFIGURED ? 'Email' : 'Username'),
          e('div', {className: 'login-input-wrap'},
            e(UserIcon),
            e('input', {
              className: 'login-input' + (error ? ' error' : ''),
              type: 'text',
              placeholder: SUPABASE_CONFIGURED ? 'Enter your email' : 'Enter your username',
              value: username,
              onChange: function(ev) { setUsername(ev.target.value); setError(''); },
              onKeyDown: handleKeyDown,
              autoFocus: true,
              autoComplete: 'username'
            })
          )
        ),

        // Password field
        e('div', {className: 'login-form-group'},
          e('label', null, 'Password'),
          e('div', {className: 'login-input-wrap'},
            e(LockIcon),
            e('input', {
              className: 'login-input' + (error ? ' error' : ''),
              type: showPw ? 'text' : 'password',
              placeholder: 'Enter your password',
              value: password,
              onChange: function(ev) { setPassword(ev.target.value); setError(''); },
              onKeyDown: handleKeyDown,
              autoComplete: 'current-password'
            }),
            e('button', {
              className: 'password-toggle',
              type: 'button',
              onClick: function() { setShowPw(function(v) { return !v; }); },
              tabIndex: -1
            }, showPw ? e(EyeOffIcon) : e(EyeIcon))
          )
        ),

        // Login button
        e('button', {
          className: 'login-btn',
          onClick: handleSubmit,
          disabled: loading
        },
          loading ? e('span', null, e('span', {className: 'spinner'}), 'Signing in...') : 'Sign In'
        ),

        // Footer
        e('div', {className: 'login-footer'},
          e('p', null, 'Inventory Management System'),
          e('p', {style: {marginTop: 4, opacity: 0.7}}, '\u00a9 ' + new Date().getFullYear() + " Seafood Sam's \u2014 Falmouth, MA")
        )
      )
    )
  );
}

const SearchIcon = () => e('svg', {width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'white',strokeWidth:2}, e('circle',{cx:11,cy:11,r:8}), e('path',{d:'m21 21-4.35-4.35'}));
const DownloadIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('path',{d:'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'}), e('polyline',{points:'7 10 12 15 17 10'}), e('line',{x1:12,y1:15,x2:12,y2:3}));
const PlusIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.5}, e('line',{x1:12,y1:5,x2:12,y2:19}), e('line',{x1:5,y1:12,x2:19,y2:12}));
const EditIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('path',{d:'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'}), e('path',{d:'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'}));
const TrashIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('polyline',{points:'3 6 5 6 21 6'}), e('path',{d:'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'}));
const DragIcon = () => e('svg', {width:16,height:16,viewBox:'0 0 24 24',fill:'currentColor'}, e('circle',{cx:9,cy:5,r:1.5}), e('circle',{cx:15,cy:5,r:1.5}), e('circle',{cx:9,cy:12,r:1.5}), e('circle',{cx:15,cy:12,r:1.5}), e('circle',{cx:9,cy:19,r:1.5}), e('circle',{cx:15,cy:19,r:1.5}));
const ReorderIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('line',{x1:4,y1:6,x2:20,y2:6}), e('line',{x1:4,y1:12,x2:20,y2:12}), e('line',{x1:4,y1:18,x2:20,y2:18}), e('polyline',{points:'1 4 4 1 7 4'}), e('polyline',{points:'1 20 4 23 7 20'}));
const CheckCircleIcon = () => e('svg', {width:14,height:14,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('path',{d:'M22 11.08V12a10 10 0 1 1-5.93-9.14'}), e('polyline',{points:'22 4 12 14.01 9 11.01'}));
const InfoIcon = () => e('svg', {width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2}, e('circle',{cx:12,cy:12,r:10}), e('line',{x1:12,y1:16,x2:12,y2:12}), e('line',{x1:12,y1:8,x2:12.01,y2:8}));

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
  var _user = useState(null);
  var currentUser = _user[0]; var setCurrentUser = _user[1];
  var _checkingSession = useState(SUPABASE_CONFIGURED);
  var checkingSession = _checkingSession[0]; var setCheckingSession = _checkingSession[1];

  // ──── Restore session on page load ────
  useEffect(function() {
    if (!SUPABASE_CONFIGURED) return;

    SupaAuth.getSession().then(function(result) {
      var session = result.data && result.data.session;
      if (session && session.user) {
        var user = session.user;
        SupaAuth.getProfile(user.id).then(function(profileResult) {
          var profile = profileResult.data;
          setCurrentUser({
            id: user.id,
            username: user.email,
            displayName: profile ? profile.display_name : user.email.split('@')[0],
            role: profile ? profile.role : 'staff',
            supabaseUser: true
          });
          setCheckingSession(false);
        });
      } else {
        setCheckingSession(false);
      }
    });

    // Also listen for future auth changes (token refresh, etc.)
    var sub = SupaAuth.onAuthChange(function(event, session) {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return function() {
      if (sub && sub.data && sub.data.subscription) {
        sub.data.subscription.unsubscribe();
      }
    };
  }, []);

  var handleLogin = function(user) {
    setCurrentUser(user);
  };

  var handleLogout = function() {
    if (SUPABASE_CONFIGURED) {
      SupaAuth.signOut().then(function() {
        setCurrentUser(null);
      });
    } else {
      setCurrentUser(null);
    }
  };

  // Show loading while checking for existing session
  if (checkingSession) {
    return e('div', {className:'loading-screen'},
      e('div', {className:'spinner-lg'}),
      e('p', null, 'Restoring session...')
    );
  }

  // Show login page if not authenticated
  if (!currentUser) {
    return e(LoginPage, { onLogin: handleLogin });
  }

  // ──── Main App (authenticated) ────
  return e(MainApp, { currentUser: currentUser, onLogout: handleLogout });
}

function MainApp(props) {
  var currentUser = props.currentUser;
  var onLogout = props.onLogout;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('loading'); // 'loading', 'synced', 'offline', 'error', 'pending'
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
  const [reorderMode, setReorderMode] = useState(false);
  const [customOrders, setCustomOrders] = useState({});
  const [dragState, setDragState] = useState({draggingId:null, overId:null, overPos:null});
  const [pendingCount, setPendingCount] = useState(0);
  const perPage = 50;

  // ──── Online/Offline detection & auto-sync ────
  useEffect(function() {
    if (!SUPABASE_CONFIGURED) return;

    // Initialize pending count from queue
    setPendingCount(OfflineQueue.count());

    // Listen for queue changes
    var unsubQueue = OfflineQueue.onChange(function(count) {
      setPendingCount(count);
      if (count > 0) {
        setSyncStatus('pending');
      }
    });

    // When browser comes back online, sync the queue
    function handleOnline() {
      console.log('[Offline] Back online — syncing queued changes...');
      setSyncStatus('loading');
      OfflineQueue.sync().then(function(result) {
        if (result.synced > 0) {
          setToast({message: result.synced + ' queued change(s) synced!', type:'success'});
          // Reload fresh data from Supabase
          SupaDB.loadItems().then(function(r) {
            if (r.data) setItems(r.data.map(dbToItem));
          });
        }
        setSyncStatus(OfflineQueue.count() > 0 ? 'pending' : 'synced');
      });
    }

    function handleOffline() {
      console.log('[Offline] Connection lost');
      setSyncStatus('offline');
      setToast({message: 'You\'re offline — changes will be saved and synced later', type:'warning'});
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if we have pending items from a previous session
    if (OfflineQueue.count() > 0 && navigator.onLine) {
      handleOnline();
    }

    return function() {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubQueue();
    };
  }, []);

  // ──── Load data from Supabase on mount ────
  useEffect(function() {
    if (!SUPABASE_CONFIGURED) {
      // Fallback: use local JSON data
      setItems(window.INITIAL_DATA || []);
      setLoading(false);
      setSyncStatus('offline');
      return;
    }

    // Load items from Supabase
    SupaDB.loadItems().then(function(result) {
      if (result.error) {
        console.error('Failed to load from Supabase:', result.error);
        setItems(window.INITIAL_DATA || []);
        setSyncStatus('error');
      } else if (result.data && result.data.length > 0) {
        setItems(result.data.map(dbToItem));
        setSyncStatus('synced');
      } else {
        // Database is empty — use local data as seed
        setItems(window.INITIAL_DATA || []);
        setSyncStatus('synced');
      }
      setLoading(false);
    });

    // Load custom sort orders
    SupaDB.loadCustomOrders().then(function(result) {
      if (result.data && result.data.length > 0) {
        var orders = {};
        result.data.forEach(function(row) {
          orders[row.location_name] = row.item_order;
        });
        setCustomOrders(orders);
      }
    });

    // ──── Realtime subscription for multi-device sync ────
    var channel = SupaDB.subscribeToItems(
      // INSERT
      function(newRow) {
        var newItem = dbToItem(newRow);
        setItems(function(prev) {
          // Don't add duplicates
          if (prev.some(function(i) { return i.id === newItem.id; })) return prev;
          return prev.concat([newItem]);
        });
      },
      // UPDATE
      function(updatedRow) {
        var updated = dbToItem(updatedRow);
        setItems(function(prev) {
          return prev.map(function(item) {
            return item.id === updated.id ? updated : item;
          });
        });
      },
      // DELETE
      function(deletedRow) {
        setItems(function(prev) {
          return prev.filter(function(item) { return item.id !== deletedRow.id; });
        });
      }
    );

    // Cleanup on unmount
    return function() {
      SupaDB.unsubscribe(channel);
    };
  }, []);

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

  // Is custom order active for the current location filter?
  var isCustomOrderActive = locationFilter !== 'All' && customOrders[locationFilter] && customOrders[locationFilter].length > 0;
  // Can we enter reorder mode? Only when a specific location is selected and no search/category filter
  var canReorder = locationFilter !== 'All' && !search && categoryFilter === 'All';

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

    // If custom order exists for this location and we're not searching, use it
    var locOrder = customOrders[locationFilter];
    if (locationFilter !== 'All' && locOrder && locOrder.length > 0 && !search && categoryFilter === 'All') {
      // Sort by custom order; items not in the order go to the end
      var orderMap = {};
      locOrder.forEach(function(id, idx) { orderMap[id] = idx; });
      result.sort(function(a, b) {
        var oa = orderMap[a.id] !== undefined ? orderMap[a.id] : 99999;
        var ob = orderMap[b.id] !== undefined ? orderMap[b.id] : 99999;
        return oa - ob;
      });
    } else {
      result.sort(function(a, b) {
        var va = a[sortField], vb = b[sortField];
        if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [items, search, locationFilter, categoryFilter, sortField, sortDir, customOrders]);

  const pageCount = Math.ceil(filtered.length / perPage);
  const pageItems = reorderMode ? filtered : filtered.slice((tablePage - 1) * perPage, tablePage * perPage);
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
    var count = Object.keys(changes).length;
    var now = new Date().toISOString().split('T')[0];

    // Optimistic update: apply locally immediately
    setItems(function(prev) { return prev.map(function(item) {
      if (changes[item.id] !== undefined) {
        var newQty = changes[item.id];
        return Object.assign({}, item, {quantity:newQty, totalValue:Math.round(newQty*item.price*100)/100, lastCounted:now});
      }
      return item;
    }); });
    setChanges({});

    // Persist to Supabase
    if (SUPABASE_CONFIGURED) {
      SupaDB.saveQuantityChanges(changes, items).then(function(result) {
        if (result._queued) {
          setSyncStatus('pending');
          setToast({message:count+' item(s) saved locally — will sync when online', type:'warning'});
        } else if (result.error) {
          console.error('Save failed:', result.error);
          setToast({message:'Save failed — changes may not sync', type:'warning'});
        } else {
          setToast({message:count+' item(s) saved & synced', type:'success'});
        }
      });
    } else {
      setToast({message:count+' item(s) updated (local only)', type:'success'});
    }
  };

  var discardChanges = function() { setChanges({}); };

  // ──── Drag & Drop Reorder ────
  var handleDragStart = function(itemId, ev) {
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', itemId);
    setDragState(function(s) { return Object.assign({}, s, {draggingId: itemId}); });
  };

  var handleDragOver = function(itemId, ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
    // Determine if cursor is in top or bottom half of row
    var rect = ev.currentTarget.getBoundingClientRect();
    var midY = rect.top + rect.height / 2;
    var pos = ev.clientY < midY ? 'above' : 'below';
    setDragState(function(s) { return Object.assign({}, s, {overId: itemId, overPos: pos}); });
  };

  var handleDragLeave = function(itemId, ev) {
    // Only clear if actually leaving the row (not entering a child)
    if (!ev.currentTarget.contains(ev.relatedTarget)) {
      setDragState(function(s) {
        if (s.overId === itemId) return Object.assign({}, s, {overId: null, overPos: null});
        return s;
      });
    }
  };

  var handleDrop = function(targetId, ev) {
    ev.preventDefault();
    var sourceId = parseInt(ev.dataTransfer.getData('text/plain'));
    if (!sourceId || sourceId === targetId) {
      setDragState({draggingId:null, overId:null, overPos:null});
      return;
    }

    // Build the new order for this location
    var currentIds = filtered.map(function(i) { return i.id; });
    var sourceIdx = currentIds.indexOf(sourceId);
    var targetIdx = currentIds.indexOf(targetId);
    if (sourceIdx === -1 || targetIdx === -1) {
      setDragState({draggingId:null, overId:null, overPos:null});
      return;
    }

    // Remove source from its position
    currentIds.splice(sourceIdx, 1);
    // Find target position after removal
    var newTargetIdx = currentIds.indexOf(targetId);
    // Insert based on cursor position
    if (dragState.overPos === 'below') {
      currentIds.splice(newTargetIdx + 1, 0, sourceId);
    } else {
      currentIds.splice(newTargetIdx, 0, sourceId);
    }

    // Save custom order for this location
    setCustomOrders(function(prev) {
      var updated = Object.assign({}, prev);
      updated[locationFilter] = currentIds;
      return updated;
    });

    // Persist to Supabase
    if (SUPABASE_CONFIGURED) {
      SupaDB.saveCustomOrder(locationFilter, currentIds).then(function(result) {
        if (result.error) {
          console.error('Failed to save custom order:', result.error);
          setToast({message:'Order saved locally but failed to sync', type:'warning'});
        }
      });
    }

    setDragState({draggingId:null, overId:null, overPos:null});
    setToast({message:'Item order updated', type:'success'});
  };

  var handleDragEnd = function() {
    setDragState({draggingId:null, overId:null, overPos:null});
  };

  // Touch-friendly move up/down for iPad reordering
  var moveItem = function(itemId, direction) {
    var currentIds = customOrders[locationFilter] || filtered.map(function(i) { return i.id; });
    currentIds = currentIds.slice(); // clone
    var idx = currentIds.indexOf(itemId);
    if (idx === -1) return;
    var newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentIds.length) return;

    // Swap
    var tmp = currentIds[idx];
    currentIds[idx] = currentIds[newIdx];
    currentIds[newIdx] = tmp;

    setCustomOrders(function(prev) {
      var updated = Object.assign({}, prev);
      updated[locationFilter] = currentIds;
      return updated;
    });

    // Persist to Supabase
    if (SUPABASE_CONFIGURED) {
      SupaDB.saveCustomOrder(locationFilter, currentIds).then(function(result) {
        if (result.error) {
          console.error('Failed to save order:', result.error);
        }
      });
    }
  };

  var toggleReorderMode = function() {
    if (!reorderMode && locationFilter !== 'All') {
      // Entering reorder mode — initialize custom order from current display if none exists
      if (!customOrders[locationFilter] || customOrders[locationFilter].length === 0) {
        var currentIds = filtered.map(function(i) { return i.id; });
        setCustomOrders(function(prev) {
          var updated = Object.assign({}, prev);
          updated[locationFilter] = currentIds;
          return updated;
        });
      }
    } else if (reorderMode && locationFilter !== 'All') {
      // Exiting reorder mode — persist the current order to Supabase
      var orderToSave = customOrders[locationFilter];
      if (SUPABASE_CONFIGURED && orderToSave && orderToSave.length > 0) {
        SupaDB.saveCustomOrder(locationFilter, orderToSave).then(function(result) {
          if (result.error) {
            console.error('Failed to save order on exit:', result.error);
            setToast({message:'Order may not have synced', type:'warning'});
          } else {
            setToast({message:'Walkthrough order saved & synced for ' + locationFilter, type:'success'});
          }
        });
      }
    }
    setReorderMode(function(v) { return !v; });
  };

  var clearCustomOrder = function() {
    setCustomOrders(function(prev) {
      var updated = Object.assign({}, prev);
      delete updated[locationFilter];
      return updated;
    });
    setReorderMode(false);

    // Persist to Supabase
    if (SUPABASE_CONFIGURED) {
      SupaDB.deleteCustomOrder(locationFilter);
    }

    setToast({message:'Custom order cleared for ' + locationFilter, type:'warning'});
  };

  var addItem = function() {
    if (SUPABASE_CONFIGURED) {
      SupaDB.addItem(newItem).then(function(result) {
        if (result._queued) {
          // Offline — add locally with temp ID
          var tempItem = Object.assign({id: Date.now()}, newItem, {
            quantity:parseFloat(newItem.quantity)||0, price:parseFloat(newItem.price)||0,
            totalValue:(parseFloat(newItem.quantity)||0)*(parseFloat(newItem.price)||0),
            lastCounted:new Date().toISOString().split('T')[0]
          });
          setItems(function(prev) { return prev.concat([tempItem]); });
          setModal(null);
          setNewItem({name:'',itemNumber:'',category:'Food',location:'Cellar',quantity:0,quantityUnit:'CS',price:0,priceUnit:'CS'});
          setSyncStatus('pending');
          setToast({message:'"'+newItem.name+'" added locally — will sync when online', type:'warning'});
        } else if (result.error) {
          console.error('Add failed:', result.error);
          setToast({message:'Failed to add item', type:'warning'});
          return;
        } else {
          var savedItem = dbToItem(result.data);
          setItems(function(prev) { return prev.concat([savedItem]); });
          setModal(null);
          setNewItem({name:'',itemNumber:'',category:'Food',location:'Cellar',quantity:0,quantityUnit:'CS',price:0,priceUnit:'CS'});
          setToast({message:'"'+savedItem.name+'" added & synced', type:'success'});
        }
      });
    } else {
      // Local fallback
      var item = Object.assign({id:Math.max.apply(null,items.map(function(i){return i.id;}))+1}, newItem, {
        quantity:parseFloat(newItem.quantity)||0, price:parseFloat(newItem.price)||0,
        totalValue:(parseFloat(newItem.quantity)||0)*(parseFloat(newItem.price)||0),
        lastCounted:new Date().toISOString().split('T')[0]
      });
      setItems(function(prev){return prev.concat([item]);});
      setModal(null);
      setNewItem({name:'',itemNumber:'',category:'Food',location:'Cellar',quantity:0,quantityUnit:'CS',price:0,priceUnit:'CS'});
      setToast({message:'"'+item.name+'" added (local only)', type:'success'});
    }
  };

  var saveEdit = function() {
    var qty = parseFloat(editItem.quantity)||0;
    var price = parseFloat(editItem.price)||0;
    var updatedItem = Object.assign({}, editItem, {quantity:qty, price:price, totalValue:Math.round(qty*price*100)/100});

    // Optimistic local update
    setItems(function(prev){return prev.map(function(i){
      return i.id === updatedItem.id ? updatedItem : i;
    });});
    setModal(null); setEditItem(null);

    if (SUPABASE_CONFIGURED) {
      SupaDB.updateItem(updatedItem).then(function(result) {
        if (result._queued) {
          setSyncStatus('pending');
          setToast({message:'Item saved locally — will sync when online', type:'warning'});
        } else if (result.error) {
          console.error('Update failed:', result.error);
          setToast({message:'Update failed — may not sync', type:'warning'});
        } else {
          setToast({message:'Item saved & synced', type:'success'});
        }
      });
    } else {
      setToast({message:'Item updated (local only)', type:'success'});
    }
  };

  var deleteItem = function(id) {
    if (!confirm('Delete this item?')) return;
    var item = items.find(function(i){return i.id===id;});

    // Optimistic local delete
    setItems(function(prev){return prev.filter(function(i){return i.id!==id;});});

    if (SUPABASE_CONFIGURED) {
      SupaDB.deleteItem(id).then(function(result) {
        if (result._queued) {
          setSyncStatus('pending');
          setToast({message:'"'+(item?item.name:'')+'" deleted locally — will sync when online', type:'warning'});
        } else if (result.error) {
          console.error('Delete failed:', result.error);
          setToast({message:'Delete failed — may not sync', type:'warning'});
        } else {
          setToast({message:'"'+(item?item.name:'')+'" deleted & synced', type:'success'});
        }
      });
    } else {
      setToast({message:'"'+(item?item.name:'')+'" deleted (local only)', type:'warning'});
    }
  };

  var closeInventory = function() {
    var now = new Date().toISOString().split('T')[0];

    // Optimistic local update
    setItems(function(prev){return prev.map(function(i){return Object.assign({},i,{lastCounted:now});});});

    if (SUPABASE_CONFIGURED) {
      SupaDB.closeInventory().then(function(result) {
        if (result._queued) {
          setSyncStatus('pending');
          setToast({message:'Inventory closed locally — will sync when online', type:'warning'});
        } else if (result.error) {
          console.error('Close inventory failed:', result.error);
          setToast({message:'Close failed — may not sync', type:'warning'});
        } else {
          setToast({message:'Inventory closed & synced for '+fmtDate(now), type:'success'});
        }
      });
    } else {
      setToast({message:'Inventory closed for '+fmtDate(now)+' (local only)', type:'success'});
    }
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
          e('div', {className:'brand-icon'}, '🦞'),
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
          e('div', {className:'sync-badge '+syncStatus},
            e('div', {className:'sync-dot'}),
            syncStatus === 'synced' ? 'Synced' :
            syncStatus === 'pending' ? pendingCount + ' Pending' :
            syncStatus === 'offline' ? (pendingCount > 0 ? 'Offline (' + pendingCount + ')' : 'Offline') :
            syncStatus === 'error' ? 'Error' : 'Syncing...'
          ),
          e('button', {className:'btn btn-ghost', onClick:exportCSV}, e(DownloadIcon), ' Export'),
          e('button', {className:'btn btn-primary', onClick:function(){setModal('add');}}, e(PlusIcon), ' Add Item'),
          e('div', {className:'user-badge'},
            e('div', {className:'user-avatar'}, currentUser.displayName.charAt(0).toUpperCase()),
            e('span', null, currentUser.displayName),
            e('button', {className:'logout-btn', onClick:onLogout, title:'Sign out'}, e(LogoutIcon))
          )
        )
      ),
      e('nav', {className:'nav-tabs'},
        ['track','summary','food-cost','manage'].map(function(t) {
          var label = t==='track'?'Track Inventory':t==='summary'?'Summary':t==='food-cost'?'Food Cost':'Manage';
          return e('button', {key:t, className:'nav-tab '+(page===t?'active':''), onClick:function(){setPage(t);}}, label);
        })
      )
    ),

    loading ? e('div', {className:'main-content'},
      e('div', {className:'loading-screen'},
        e('div', {className:'spinner-lg'}),
        e('p', null, 'Loading inventory from database...')
      )
    ) :
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
          e('button', {className:'loc-chip '+(locationFilter==='All'?'active':''), onClick:function(){setLocationFilter('All');setTablePage(1);setReorderMode(false);}},
            'All Locations ', e('span', {className:'count'}, items.length)
          ),
          allLocations.map(function(loc) {
            return e('button', {key:loc, className:'loc-chip '+(locationFilter===loc?'active':''), onClick:function(){setLocationFilter(loc);setTablePage(1);setReorderMode(false);}},
              loc, ' ', e('span', {className:'count'}, (locations[loc]||{}).count||0)
            );
          })
        ),
        // Table
        e('div', {className:'table-container'},
          e('div', {className:'table-header'},
            e('h2', null, 'Inventory Items ('+filtered.length+')',
              isCustomOrderActive && !reorderMode ? e('span', {className:'custom-order-badge'}, '\u2195 Custom Order') : null
            ),
            e('div', {className:'filter-row'},
              canReorder && e('button', {
                className:'btn-reorder '+(reorderMode?'active':''),
                onClick: toggleReorderMode
              }, e(ReorderIcon), reorderMode ? 'Done Reordering' : 'Reorder Items'),
              isCustomOrderActive && !reorderMode && e('button', {
                className:'btn-reorder',
                onClick: clearCustomOrder,
                title: 'Reset to alphabetical order'
              }, '\u00d7 Reset Order'),
              e('select', {className:'filter-select', value:categoryFilter, onChange:function(ev){setCategoryFilter(ev.target.value);setTablePage(1);}},
                e('option', {value:'All'}, 'All Categories'),
                allCategories.map(function(c){return e('option', {key:c, value:c}, c);})
              )
            )
          ),
          reorderMode && e('div', {className:'reorder-bar'},
            e('div', {className:'reorder-info'},
              e(InfoIcon),
              'Drag items to match your physical walkthrough order for counting. This order is saved per location.'
            ),
            e('div', {className:'reorder-actions'},
              e('button', {className:'btn btn-sm btn-primary', onClick: function(){ setReorderMode(false); }}, e(CheckCircleIcon), ' Done')
            )
          ),
          e('div', {style:{overflowX:'auto'}},
            e('table', null,
              e('thead', null,
                e('tr', null,
                  reorderMode && e('th', {className:'th-reorder'}, '#'),
                  e('th', {className: isCustomOrderActive && !reorderMode ? 'sort-disabled' : '', onClick:function(){ if (!isCustomOrderActive || reorderMode) handleSort('name');}}, 'Item'+(isCustomOrderActive && !reorderMode ? '' : sortIcon('name'))),
                  e('th', {className: isCustomOrderActive && !reorderMode ? 'sort-disabled' : '', onClick:function(){ if (!isCustomOrderActive || reorderMode) handleSort('category');}}, 'Category'+(isCustomOrderActive && !reorderMode ? '' : sortIcon('category'))),
                  e('th', {className: isCustomOrderActive && !reorderMode ? 'sort-disabled' : '', onClick:function(){ if (!isCustomOrderActive || reorderMode) handleSort('location');}}, 'Location'+(isCustomOrderActive && !reorderMode ? '' : sortIcon('location'))),
                  e('th', {className: isCustomOrderActive && !reorderMode ? 'sort-disabled' : '', onClick:function(){ if (!isCustomOrderActive || reorderMode) handleSort('quantity');}}, 'Qty on Hand'+(isCustomOrderActive && !reorderMode ? '' : sortIcon('quantity'))),
                  e('th', {className: isCustomOrderActive && !reorderMode ? 'sort-disabled' : '', onClick:function(){ if (!isCustomOrderActive || reorderMode) handleSort('price');}}, 'Price'+(isCustomOrderActive && !reorderMode ? '' : sortIcon('price'))),
                  e('th', {className: isCustomOrderActive && !reorderMode ? 'sort-disabled' : '', onClick:function(){ if (!isCustomOrderActive || reorderMode) handleSort('totalValue');}}, 'Value'+(isCustomOrderActive && !reorderMode ? '' : sortIcon('totalValue'))),
                  e('th', {className: isCustomOrderActive && !reorderMode ? 'sort-disabled' : '', onClick:function(){ if (!isCustomOrderActive || reorderMode) handleSort('lastCounted');}}, 'Last Counted'+(isCustomOrderActive && !reorderMode ? '' : sortIcon('lastCounted'))),
                  e('th', {style:{width:60}})
                )
              ),
              e('tbody', null,
                pageItems.length === 0 ?
                  e('tr', null, e('td', {colSpan:8}, e('div', {className:'empty-state'}, e('h3', null, 'No items found'), e('p', null, 'Try adjusting your search or filters'))))
                :
                pageItems.map(function(item, rowIndex) {
                  var currentQty = changes[item.id] !== undefined ? changes[item.id] : item.quantity;
                  var currentVal = changes[item.id] !== undefined ? Math.round(changes[item.id]*item.price*100)/100 : item.totalValue;
                  var isDragging = dragState.draggingId === item.id;
                  var isOver = dragState.overId === item.id;
                  var dragClass = isDragging ? ' dragging' : '';
                  if (isOver && dragState.overPos === 'above') dragClass += ' drag-over-above';
                  if (isOver && dragState.overPos === 'below') dragClass += ' drag-over-below';

                  var rowProps = {key:item.id, className: dragClass.trim()};
                  if (reorderMode) {
                    rowProps.draggable = true;
                    rowProps.onDragStart = function(ev) { handleDragStart(item.id, ev); };
                    rowProps.onDragOver = function(ev) { handleDragOver(item.id, ev); };
                    rowProps.onDragLeave = function(ev) { handleDragLeave(item.id, ev); };
                    rowProps.onDrop = function(ev) { handleDrop(item.id, ev); };
                    rowProps.onDragEnd = handleDragEnd;
                  }

                  return e('tr', rowProps,
                    reorderMode && e('td', {style:{textAlign:'center', padding:'12px 6px'}},
                      e('div', {style:{display:'flex', alignItems:'center', gap:4, justifyContent:'center'}},
                        e('span', {className:'row-number'}, rowIndex + 1),
                        e('div', {className:'drag-handle'}, e(DragIcon)),
                        e('div', {className:'reorder-touch-btns'},
                          e('button', {className:'reorder-touch-btn', title:'Move up', onClick:function(){moveItem(item.id,'up');}, disabled:rowIndex===0}, '\u25B2'),
                          e('button', {className:'reorder-touch-btn', title:'Move down', onClick:function(){moveItem(item.id,'down');}, disabled:rowIndex===filtered.length-1}, '\u25BC')
                        )
                      )
                    ),
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
          !reorderMode && pageCount > 1 && e('div', {className:'pagination'},
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