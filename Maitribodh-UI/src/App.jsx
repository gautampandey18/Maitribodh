import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import { api } from './api.js';
import { sessionEnded } from './store.js';
import ApprovalsPage from './screens/ApprovalsPage.jsx';
import DashboardPage from './screens/DashboardPage.jsx';
import LoginPage from './screens/LoginPage.jsx';
import PasswordPage from './screens/PasswordPage.jsx';
import UsersPage from './screens/UsersPage.jsx';
import PersonsPage from './screens/PersonsPage.jsx';
import PublicQrPage from './screens/PublicQrPage.jsx';
import LocationsPage from './screens/LocationsPage.jsx';
import BlacklistPage from './screens/BlacklistPage.jsx';
import ReportsPage from './screens/ReportsPage.jsx';
import RegisterPage from './screens/RegisterPage.jsx';
import GatePage from './screens/GatePage.jsx';
import QrPage from './screens/QrPage.jsx';
import MasterDataPage from './screens/MasterDataPage.jsx';
import PersonDetailPage from './screens/PersonDetailPage.jsx';
import ActivityPage, { NotificationsBell } from './screens/ActivityPage.jsx';
import { NAVIGATION, canAccessPath, landingPath } from './constants/navigation.js';

const drawerWidth = 238;
const collapsedDrawerWidth = 76;

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/public-qr" element={<PublicQrPage />} />
      <Route element={<RequireSession />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/categories" element={<AdminOnly><Navigate to="/master?tab=categories" replace /></AdminOnly>} />
          <Route path="/locations" element={<AdminOnly><LocationsPage /></AdminOnly>} />
          <Route path="/blacklist" element={<AdminOnly><BlacklistPage /></AdminOnly>} />
          <Route path="/reports" element={<ReportAccess><ReportsPage /></ReportAccess>} />
          <Route path="/users" element={<AdminOnly><UsersPage /></AdminOnly>} />
          <Route path="/approvals" element={<ApprovalAccess><ApprovalsPage /></ApprovalAccess>} />
          <Route path="/persons" element={<RegistrationAccess><PersonsPage /></RegistrationAccess>} />
          <Route path="/persons/:personId" element={<RegistrationAccess><PersonDetailPage /></RegistrationAccess>} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/gate" element={<GatePage />} />
          <Route path="/qr" element={<AdminOnly><QrPage /></AdminOnly>} />
          <Route path="/audit" element={<AdminOnly><ActivityPage /></AdminOnly>} />
          <Route path="/master" element={<AdminOnly><MasterDataPage /></AdminOnly>} />
          <Route path="/password" element={<PasswordPage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function RequireSession() {
  const auth = useSelector((state) => state.auth);
  const location = useLocation();

  if (!auth.accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (auth.mustChangePassword && location.pathname !== '/password') {
    return <Navigate to="/password" replace />;
  }
  if (!canAccessPath(auth.user?.role, location.pathname)) {
    return <Navigate to={landingPath(auth.user?.role)} replace />;
  }
  return <Outlet />;
}

function AdminOnly({ children }) {
  const role = useSelector((state) => state.auth.user?.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
    ? children
    : <Navigate to="/dashboard" replace />;
}

function ApprovalAccess({ children }) {
  const role = useSelector((state) => state.auth.user?.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'APPROVER'
    ? children
    : <Navigate to="/dashboard" replace />;
}

function RegistrationAccess({ children }) {
  const role = useSelector((state) => state.auth.user?.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'APPROVER' || role === 'REG_OFFICER'
    ? children
    : <Navigate to="/dashboard" replace />;
}

function ReportAccess({ children }) {
  const role = useSelector((state) => state.auth.user?.role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'APPROVER' || role === 'REG_OFFICER' || role === 'VIEWER'
    ? children
    : <Navigate to="/dashboard" replace />;
}

function AppShell() {
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const visibleNavigation = NAVIGATION.filter((item) => canAccessPath(auth.user?.role, item.path));
  const userRole = auth.user?.role?.replaceAll('_', ' ') ?? 'Unknown';
  const icons = { '/dashboard': <DashboardOutlinedIcon />, '/persons': <SearchOutlinedIcon />, '/register': <PeopleAltOutlinedIcon />, '/approvals': <FactCheckOutlinedIcon />, '/qr': <KeyOutlinedIcon />, '/gate': <PlaceOutlinedIcon />, '/blacklist': <GppBadOutlinedIcon />, '/reports': <AssessmentOutlinedIcon />, '/users': <PeopleAltOutlinedIcon />, '/master': <TuneOutlinedIcon />, '/locations': <PlaceOutlinedIcon />, '/audit': <FactCheckOutlinedIcon /> };
  const navigationWidth = sidebarCollapsed ? collapsedDrawerWidth : drawerWidth;

  async function handleLogout() {
    await api.post('/auth/logout').catch(() => null);
    dispatch(sessionEnded());
    navigate('/login', { replace: true });
  }

  const navigation = (
    <Box className={`side-nav-content${sidebarCollapsed && isWide ? ' sidebar-collapsed' : ''}`}>
      <Box className="brand-lockup">
        <Box className="brand-dot" />
        <Box className="brand-copy">
          <Typography className="brand-title">MAITRIBODH AMS</Typography>
        </Box>
        <Tooltip title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}>
          <IconButton
            aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            className="sidebar-collapse"
            size="small"
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            {sidebarCollapsed ? <ChevronRightOutlinedIcon /> : <ChevronLeftOutlinedIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      {[...new Set(visibleNavigation.map((item) => item.group))].map((group) => <Box key={group}>
        <Typography className="nav-section-label">{group.toUpperCase()}</Typography>
        <List disablePadding>{visibleNavigation.filter((item) => item.group === group).map((item) => <Tooltip key={item.path} title={sidebarCollapsed ? item.label : ''} placement="right"><ListItemButton aria-label={item.label} component={Link} to={item.path} selected={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)} onClick={() => setDrawerOpen(false)}><ListItemIcon>{icons[item.path]}</ListItemIcon><ListItemText primary={item.label} /></ListItemButton></Tooltip>)}</List>
      </Box>)}
    </Box>
  );

  return (
    <Box className="app-frame">
      <AppBar position="fixed" className="top-bar" sx={{ ml: { md: `${navigationWidth}px` }, width: { md: `calc(100% - ${navigationWidth}px)` } }}>
        <Toolbar className="top-toolbar">
          {!isWide && (
            <IconButton aria-label="Open navigation" onClick={() => setDrawerOpen(true)} edge="start">
              <MenuIcon />
            </IconButton>
          )}
          <Typography sx={{ display: { xs: 'block', sm: 'none' }, fontWeight: 700 }}>MAMS</Typography>
          <Box className="top-context" sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="overline">MAITRIBODH ASHRAM</Typography>
            <Typography variant="body2">Access operations</Typography>
          </Box>
          <Box className="top-actions">
            <NotificationsBell />
            <Tooltip title={`Signed in as ${userRole}`}>
              <Box className="top-user-role">
                <Typography variant="caption">SIGNED IN AS</Typography>
                <Typography className="top-user-role-name">{userRole}</Typography>
              </Box>
            </Tooltip>
            <Tooltip title={`Signed in as ${userRole}`}>
              <Avatar aria-label={`Signed in as ${userRole}`} sx={{ width: 30, height: 30, fontSize: 12 }}>{auth.user?.role?.slice(0, 2)}</Avatar>
            </Tooltip>
            <Tooltip title="Change password">
              <IconButton aria-label="Change password" onClick={() => navigate('/password')}>
                <KeyOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Button aria-label="Sign out" onClick={handleLogout} startIcon={<LogoutOutlinedIcon />} color="inherit" className="logout-button" sx={{ minWidth: { xs: 40, sm: 90 } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sign out</Box>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: navigationWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          className="app-navigation-drawer"
          variant={isWide ? 'permanent' : 'temporary'}
          open={isWide || drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: { xs: drawerWidth, md: navigationWidth }, boxSizing: 'border-box' } }}
        >
          {navigation}
        </Drawer>
      </Box>
      <Box component="main" className="main-content" sx={{ ml: { md: `${navigationWidth}px` } }}>
        <Toolbar />
        <Box className="page-container"><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Home / {NAVIGATION.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))?.label ?? 'Change Password'}</Typography><Outlet /></Box>
      </Box>
    </Box>
  );
}