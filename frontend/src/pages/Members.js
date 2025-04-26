import React, { useState, useEffect } from 'react';
import './css/Members.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { saveData, getData, addPendingOperation, getPendingOperations, clearPendingOperations } from '../utils/offlineStorage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next'; // Add translation hook

// Material-UI Imports
import {
  Box,
  Button,
  Container,
  Drawer,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  Typography,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const Members = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(); // Add t function

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [members, setMembers] = useState([]);
  const [editMember, setEditMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const API_BASE_URL = 'https://edir-if1t.onrender.com';
  const roles = ['member', 'dagna', 'gebez', 'admin'];

  useEffect(() => {
    fetchData();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOnline = () => {
    setIsOnline(true);
    syncPendingOperations();
  };

  const handleOffline = () => {
    setIsOnline(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let storedMembers = await getData('members');
      if (storedMembers) {
        setMembers(storedMembers);
      }
      if (isOnline) {
        await fetchMembers();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('members.toast.load_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/api/members`);
      setMembers(response.data);
      await saveData('members', response.data);
    } catch (error) {
      console.error('Error fetching members from API:', error);
      toast.error(t('members.toast.fetch_error'));
    }
  };

  const updateMember = async () => {
    if (isOnline) {
      try {
        await api.put(`/api/members/${editMember._id}`, editMember);
        setEditMember(null);
        fetchMembers();
        toast.success(t('members.toast.update_success'));
      } catch (error) {
        console.error('Error updating member:', error);
        toast.error(t('members.toast.update_error'));
      }
    } else {
      const updatedMembers = members.map((m) =>
        m._id === editMember._id ? editMember : m
      );
      setMembers(updatedMembers);
      await saveData('members', updatedMembers);
      addPendingOperation({ type: 'update', data: editMember });
      toast.info(t('members.toast.update_offline'));
    }
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    if (isOnline) {
      try {
        await api.delete(`/api/members/${memberToDelete._id}`);
        fetchMembers();
        toast.success(t('members.toast.delete_success'));
      } catch (error) {
        console.error('Error deleting member:', error);
        toast.error(t('members.toast.delete_error'));
      }
    } else {
      const updatedMembers = members.filter((m) => m._id !== memberToDelete._id);
      setMembers(updatedMembers);
      await saveData('members', updatedMembers);
      addPendingOperation({ type: 'delete', data: memberToDelete });
      toast.info(t('members.toast.delete_offline'));
    }
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const syncPendingOperations = async () => {
    const pendingOperations = getPendingOperations();
    if (pendingOperations.length > 0) {
      try {
        for (const operation of pendingOperations) {
          switch (operation.type) {
            case 'add':
              await api.post(`/api/members`, operation.data);
              break;
            case 'update':
              await api.put(`/api/members/${operation.data._id}`, operation.data);
              break;
            case 'delete':
              await api.delete(`/api/members/${operation.data._id}`);
              break;
            default:
              break;
          }
        }
        clearPendingOperations();
        fetchMembers();
        toast.success(t('members.toast.sync_success'));
      } catch (error) {
        console.error('Error syncing pending operations:', error);
        toast.error(t('members.toast.sync_error'));
      }
    }
  };

  const handleAddMemberNavigation = () => {
    navigate('/register');
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }} className="members-container">
      <Typography variant="h4" gutterBottom>
        {t('members.title')}
      </Typography>

      {/* Edit Member Drawer */}
      <Drawer
        anchor="right"
        open={!!editMember}
        onClose={() => setEditMember(null)}
      >
        <Box sx={{ width: { xs: 300, sm: 400 }, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('members.edit_member')}
          </Typography>
          <TextField
            fullWidth
            label={t('members.name_label')}
            value={editMember?.name || ''}
            onChange={(e) => setEditMember({ ...editMember, name: e.target.value })}
            margin="normal"
            variant="outlined"
          />
          <TextField
            fullWidth
            label={t('members.contact_label')}
            value={editMember?.contact || ''}
            onChange={(e) => setEditMember({ ...editMember, contact: e.target.value })}
            margin="normal"
            variant="outlined"
          />
          <Select
            fullWidth
            value={editMember?.role || ''}
            onChange={(e) => setEditMember({ ...editMember, role: e.target.value })}
            sx={{ mt: 2 }}
          >
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {t(`members.role_${role}`)}
              </MenuItem>
            ))}
          </Select>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={updateMember}
            >
              {t('members.update_button')}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setEditMember(null)}
            >
              {t('members.cancel_button')}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Add Member Button and Search */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddMemberNavigation}
        >
          {t('members.add_member_button')}
        </Button>
        <TextField
          variant="outlined"
          placeholder={t('members.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: '100%', sm: 300 } }}
        />
      </Box>

      {/* Member List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="left" sx={{ fontWeight: 'bold' }}>{t('members.table_name')}</TableCell>
              <TableCell align="left" sx={{ fontWeight: 'bold' }}>{t('members.table_contact')}</TableCell>
              <TableCell align="left" sx={{ fontWeight: 'bold' }}>{t('members.table_role')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('members.table_actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  {t('members.no_members')}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((member) => (
                  <motion.TableRow
                    key={member._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TableCell align="left">
                      <FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />
                      {member.name}
                    </TableCell>
                    <TableCell align="left">{member.contact}</TableCell>
                    <TableCell align="left">
                      {t(`members.role_${member.role}`)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => setEditMember(member)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(member)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </motion.TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredMembers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('members.delete_title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('members.delete_message', { name: memberToDelete?.name })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            {t('members.cancel_button')}
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t('members.delete_button')}
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Container>
  );
};

export default Members;