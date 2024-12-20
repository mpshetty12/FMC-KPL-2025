import React, { useState, useEffect } from 'react';
import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, orderBy, limit, updateDoc, arrayUnion, doc } from 'firebase/firestore';
import './FormPage.css';

const FormPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    shirtSize: '',
    jerseyNumber: '',
    address: '',
    mobileNumber: '',
    photo: null,
    playerType: '',
    aadharNumber: '',
    aadharPhoto: null,
    team: '', // Store the selected team ID here
  });
  const [teams, setTeams] = useState([]);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch teams from Firestore on component mount
  useEffect(() => {
    const fetchTeams = async () => {
      const teamCollection = collection(db, 'teams');
      const teamSnapshot = await getDocs(teamCollection);
      setTeams(teamSnapshot.docs.map((doc) => ({
        id: doc.id,
        team_id: doc.data().team_id,
        team_name: doc.data().team_name,
      })));
    };
    fetchTeams();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  const checkIfMobileNumberExists = async (mobileNumber) => {
    const q = query(collection(db, 'users'), where('mobile_number', '==', mobileNumber));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const getNextFmcid = async () => {
    const q = query(collection(db, 'users'), orderBy('fmcid', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const lastUser = querySnapshot.docs[0].data();
      return lastUser.fmcid + 1;
    } else {
      return 31;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.photo) {
      alert('Please select a photo to upload.');
      setIsSubmitting(false);
      return;
    }

    try {
      const mobileNumberExists = await checkIfMobileNumberExists(formData.mobileNumber);
      if (mobileNumberExists) {
        alert('This mobile number is already registered. Please use a different number.');
        setIsSubmitting(false);
        return;
      }

      const nextFmcid = await getNextFmcid();
      const photoFileName = `${Date.now()}_${formData.photo.name}`;
      const storageRef = ref(storage, `playerPhotos/${photoFileName}`);
      await uploadBytes(storageRef, formData.photo);
      const photoUrl = await getDownloadURL(storageRef);

      // let aadharPhotoUrl = null;
      // if (formData.playerType === 'Legend Player' && formData.aadharPhoto) {
      //   const aadharFileName = `${Date.now()}_${formData.aadharPhoto.name}`;
      //   const aadharStorageRef = ref(storage, `aadharPhotos/${aadharFileName}`);
      //   await uploadBytes(aadharStorageRef, formData.aadharPhoto);
      //   aadharPhotoUrl = await getDownloadURL(aadharStorageRef);
      // }

      // Add player data to the "users" collection
      await addDoc(collection(db, 'users'), {
        name: formData.name,
        shirt_size: formData.shirtSize,
        jersey_number: formData.jerseyNumber,
        address: formData.address,
        mobile_number: formData.mobileNumber,
        photo_url: photoUrl,
        player_type: formData.playerType,
        fmcid: nextFmcid,
        teamid: formData.team,
        payment: '',
        // ...(formData.playerType === 'Legend Player' && {
        //   aadhar_number: formData.aadharNumber,
        //   aadhar_photo_url: aadharPhotoUrl,
        // }),
      });

      // Update the selected team document in the "teams" collection
      if (formData.team) {
        const selectedTeam = teams.find((team) => team.team_id === Number(formData.team));
        if (selectedTeam) {
          const teamDocRef = doc(db, 'teams', selectedTeam.id);
          await updateDoc(teamDocRef, {
            players: arrayUnion(nextFmcid),
          });
        }
      }

      setFormSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      {formSubmitted ? (
        <div className="success-message">
          <h2>Form Submitted Successfully! please join below whatsapp group</h2>
          <h3>https://chat.whatsapp.com/HBkDo5xbMyIKRjHBLOMTbN</h3>
          <div className="checkmark">&#10004;</div>
          <p>Your details have been recorded.</p>
        </div>
      ) : (
        <>
          <h2>Enter Player Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label htmlFor="shirtSize">Shirt Size</label>
              <select id="shirtSize" name="shirtSize" onChange={handleChange} required>
                <option value="">Select Shirt Size</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="jerseyNumber">Jersey Number (0-999)</label>
              <input type="number" id="jerseyNumber" name="jerseyNumber" min="0" max="999" onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label htmlFor="address">Address</label>
              <input type="text" id="address" name="address" onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label htmlFor="mobileNumber">Mobile Number</label>
              <input type="text" id="mobileNumber" name="mobileNumber" onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label htmlFor="playerType">Player Type</label>
              <select id="playerType" name="playerType" onChange={handleChange} required>
                <option value="">Select Player Type</option>
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="Wicket Keeper">Wicket Keeper</option>
                <option value="Allrounder">Allrounder</option>
                <option value="Owner">Owner (ನೊಂದಾಯಿಸಿದ ತಂಡದವರಿಗೆ ಮಾತ್ರ)</option>
                <option value="Icon Player">Icon Player (ನೊಂದಾಯಿಸಿದ ತಂಡದವರಿಗೆ ಮಾತ್ರ)</option>
                <option value="Legend Player">Legend Player (ನೊಂದಾಯಿಸಿದ ತಂಡದವರಿಗೆ ಮಾತ್ರ)</option>
              </select>
            </div>

            {/* {formData.playerType === 'Legend Player' && (
              <>
                <div className="input-group">
                  <label htmlFor="aadharNumber">Aadhar Number</label>
                  <input type="text" id="aadharNumber" name="aadharNumber" onChange={handleChange} required />
                </div>

                <div className="input-group">
                  <label htmlFor="aadharPhoto">Upload Aadhar Photo</label>
                  <input type="file" id="aadharPhoto" name="aadharPhoto" onChange={handleFileChange} required />
                </div>
              </>
            )} */}

            {(formData.playerType === 'Owner' || formData.playerType === 'Icon Player' || formData.playerType === 'Legend Player') && (
              <div className="input-group">
                <label htmlFor="team">Select Team</label>
                <select id="team" name="team" onChange={handleChange} required>
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="input-group">
              <label htmlFor="photo">Upload Photo</label>
              <input type="file" id="photo" name="photo" onChange={handleFileChange} required />
            </div>

            <button type="submit" disabled={isSubmitting}>Submit</button>
          </form>
        </>
      )}
      <footer className="footer" id="formfooter">
        <p>© 2024 mpshetty. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default FormPage;
