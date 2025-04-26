import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faTrash, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { saveData, getData, addPendingOperation, getPendingOperations, clearPendingOperations } from '../utils/offlineStorage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './css/Members.css';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', contact: '', role: 'member' });
  const [editMember, setEditMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const API_BASE_URL = 'https://edir-if1t.onrender.com';

  const roles = ['member', 'dagna', 'gebez', 'admin']; // Define your roles

  useEffect(() => {
    fetchData();

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOnline = () => {
    setIsOnline(true);
    syncPendingOperations(); // Sync pending operations when online
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
        await fetchMembers(); // Fetch from API to update if online
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data. Using offline data if available.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/members`);
      setMembers(response.data);
      await saveData('members', response.data); // Save to offline storage
    } catch (error) {
      console.error('Error fetching members from API:', error);
      toast.error('Failed to fetch from server. Using offline data.');
    }
  };

  const addMember = async () => {
    const member = { ...newMember, _id: Date.now().toString() }; // Generate a temporary ID
    if (isOnline) {
      try {
        await axios.post(`${API_BASE_URL}/api/members`, newMember);
        setNewMember({ name: '', contact: '', role: 'member' });
        fetchMembers();
        toast.success('Member added successfully!');
      } catch (error) {
        console.error('Error adding member:', error);
        toast.error('Failed to add member.');
      }
    } else {
      setMembers([...members, member]);
      await saveData('members', [...members, member]);
      addPendingOperation({ type: 'add', data: newMember });
      toast.info('Member added locally. Syncing with backend when online.');
    }
  };

  const updateMember = async () => {
    if (isOnline) {
      try {
        await axios.put(`${API_BASE_URL}/api/members/${editMember._id}`, editMember);
        setEditMember(null);
        fetchMembers();
        toast.success('Member updated successfully!');
      } catch (error) {
        console.error('Error updating member:', error);
        toast.error('Failed to update member.');
      }
    } else {
      const updatedMembers = members.map((m) => 
        m._id === editMember._id ? editMember : m
      );
      setMembers(updatedMembers);
      await saveData('members', updatedMembers);
      addPendingOperation({ type: 'update', data: editMember });
      toast.info('Member updated locally. Syncing with backend when online.');
    }
  };

  const deleteMember = async (id) => {
    if (isOnline) {
      try {
        await axios.delete(`${API_BASE_URL}/api/members/${id}`);
        fetchMembers();
        toast.success('Member deleted successfully!');
      } catch (error) {
        console.error('Error deleting member:', error);
        toast.error('Failed to delete member.');
      }
    } else {
      const deletedMember = members.find((m) => m._id === id);
      const updatedMembers = members.filter((m) => m._id !== id);
      setMembers(updatedMembers);
      await saveData('members', updatedMembers);
      addPendingOperation({ type: 'delete', data: deletedMember });
      toast.info('Member deleted locally. Syncing with backend when online.');
    }
  };

  const syncPendingOperations = async () => {
    const pendingOperations = getPendingOperations();
    if (pendingOperations.length > 0) {
      try {
        for (const operation of pendingOperations) {
          switch (operation.type) {
            case 'add':
              await axios.post(`${API_BASE_URL}/api/members`, operation.data);
              break;
            case 'update':
              await axios.put(`${API_BASE_URL}/api/members/${operation.data._id}`, operation.data);
              break;
            case 'delete':
              await axios.delete(`${API_BASE_URL}/api/members/${operation.data._id}`);
              break;
            default:
              break;
          }
        }
        clearPendingOperations();
        fetchMembers();
        toast.success('Pending operations synced with backend!');
      } catch (error) {
        console.error('Error syncing pending operations:', error);
        toast.error('Failed to sync pending operations.');
      }
    }
  };

  if (loading) {
    return <div className="members loading">Loading...</div>;
  }

  return (
    <div className="members">
      <h1>Member Management</h1>

      <motion.div
        className="member-form"
        variants={{
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1 },
        }}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3 }}
      >
        <h2>{editMember ? 'Edit Member' : 'Add Member'}</h2>
        <input
          type="text"
          placeholder="Name"
          value={editMember ? editMember.name : newMember.name}
          onChange={(e) =>
            editMember
              ? setEditMember({ ...editMember, name: e.target.value })
              : setNewMember({ ...newMember, name: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Contact"
          value={editMember ? editMember.contact : newMember.contact}
          onChange={(e) =>
            editMember
              ? setEditMember({ ...editMember, contact: e.target.value })
              : setNewMember({ ...newMember, contact: e.target.value })
          }
        />
        <select
          value={editMember ? editMember.role : newMember.role}
          onChange={(e) =>
            editMember
              ? setEditMember({ ...editMember, role: e.target.value })
              : setNewMember({ ...newMember, role: e.target.value })
          }
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={editMember ? updateMember : addMember}
          className="form-button"
        >
          {editMember ? (
            <>
              <FontAwesomeIcon icon={faEdit} /> Update Member
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUserPlus} /> Add Member
            </>
          )}
        </button>
        {editMember && (
          <button
            onClick={() => setEditMember(null)}
            className="form-button cancel"
          >
            Cancel Edit
          </button>
        )}
      </motion.div>

      <div className="member-list">
        <h2>Member List</h2>
        {members.length === 0 ? (
          <p>No members found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <motion.tr
                  key={member._id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.3 }}
                >
                  <td>
                    <FontAwesomeIcon icon={faUser} /> {member.name}
                  </td>
                  <td>{member.contact}</td>
                  <td>{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</td>
                  <td>
                    <button
                      onClick={() => setEditMember(member)}
                      className="action-button edit"
                    >
                      <FontAwesomeIcon icon={faEdit} /> Edit
                    </button>
                    <button
                      onClick={() => deleteMember(member._id)}
                      className="action-button delete"
                    >
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Members;