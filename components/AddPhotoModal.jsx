import { useState, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, CircularProgress, Alert, } from "@mui/material";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file) { //send the file directly to Cloudinary's upload endpoint ...
    const formData = new FormData(); //... using a FormData POST request ...
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); //... with your unsigned preset

    const response = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, formData, { headers: {"Content-Type": "multipart/form-data"} } );
    return response.data;
}

async function savePhotoToBackend(url) {
    const res = await axios.post("/photos", {url});
    return res.data;
}


function AddPhotoModal({open, onClose}) {
    const [imgFile, setImgFile] = useState(null);
    const [imgError, setImgError] = useState("");
    const fileInputRef = useRef(null);
    const queryClient = useQueryClient();

    const saveMutation = useMutation({
        mutationFn: savePhotoToBackend,
        onSuccess: () => { //After a successful upload ...
            queryClient.invalidateQueries({queryKey: ["photos"]}); //...the photo feed should update automatically to show the new photo using TanStack Query's invalidateQueries
            handleClose();
        },
        onError: (err) => {
            setImgError(err?.response?.data || "Failed to save photo. Please try again!");
        }
    });

    const uploadMutation = useMutation({
        mutationFn: uploadToCloudinary,
        onSuccess: (data) => { //After Cloudinary responds...
            saveMutation.mutate(data.secure_url); //... extract the secure_url from the response and send it to your backend API to be saved
        },
        onError: (err) => {
            setImgError(err?.response.data?.error?.message || "Failed to upload to Cloudinary. Please try again!");
        }
    });

    const isUploading = uploadMutation.isPending || saveMutation.isPending;

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setImgError("Please select an image file!");
                return
            }
            setImgFile(file);
            setImgError("");
        }
    }

    const handleSubmit = () => {
        if (!imgFile) {
            setImgError("Please select an image!");
            return;
        }
        setImgError("");
        uploadMutation.mutate(imgFile);
    }

    const handleClose = () => {
        if (isUploading) {
            return;
        }
        setImgFile(null);
        setImgError("");
        onClose();
    }

    return (
        <div>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Add Photo</DialogTitle>
                <DialogContent>
                    <Box sx={{display: "flex", flexDirection: "column", gap: 2, mt: 1}}>
                        <input type='file' accept='image/*' ref={fileInputRef} onChange={handleFileChange} style={{display: "none"}} />
                        <Button variant='outlined' onClick={() => fileInputRef.current?.click()} disabled={isUploading}>{imgFile ? "Change Image" : "select Image"}</Button>

                        {imgFile && (
                            <Typography variant='body2' color="text.secondary">Selected: {imgFile.name}</Typography>
                        )}

                        {isUploading && (<Alert severity='error'>{imgError}</Alert>)}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={isUploading}>Cancel</Button>
                    <Button variant='contained' onClick={handleSubmit} disabled={!imgFile || isUploading}>Upload</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

AddPhotoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AddPhotoModal;