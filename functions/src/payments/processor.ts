import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as QRCode from "qrcode";

const db = admin.firestore();
const storage = admin.storage();

export const processPayment = functions.firestore
  .document("pending_profiles/{profileId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    
    // Only process when payment changes from pending to approved
    if (previousData.status === "pending" && newData.paymentData?.status === "approved") {
      const profileId = context.params.profileId;
      const correlationId = newData.correlationId || crypto.randomUUID();
      
      try {
        console.log(`Processing approved payment for profile ${profileId}`);
        
        // Generate QR code data
        const memorialUrl = `${process.env.FRONTEND_URL || "https://memoryys.com"}/memorial/${profileId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(memorialUrl, {
          width: 300,
          margin: 2,
        });
        
        // Create user profile
        const userProfile = {
          uniqueUrl: profileId,
          name: newData.name,
          email: newData.email,
          phone: newData.phone,
          age: newData.age,
          bloodType: newData.bloodType || null,
          allergies: newData.allergies || [],
          medications: newData.medications || [],
          medicalConditions: newData.medicalConditions || [],
          healthPlan: newData.healthPlan || null,
          preferredHospital: newData.preferredHospital || null,
          medicalNotes: newData.medicalNotes || null,
          emergencyContacts: newData.emergencyContacts || [],
          planType: newData.planType,
          planPrice: newData.planPrice,
          paymentId: newData.paymentId,
          qrCodeData: qrCodeDataUrl,
          memorialUrl,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        // Save to user_profiles collection
        await db.collection("user_profiles").doc(profileId).set(userProfile);
        
        // Create memorial page
        await db.collection("memorial_pages").doc(profileId).set({
          profileId,
          memorialUrl,
          qrCodeData: qrCodeDataUrl,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Update pending profile status
        await db.collection("pending_profiles").doc(profileId).update({
          status: "completed",
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Trigger email notification
        await db.collection("email_queue").add({
          to: newData.email,
          profileId,
          memorialUrl,
          qrCodeData: qrCodeDataUrl,
          name: newData.name,
          planType: newData.planType,
          correlationId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`Successfully processed profile ${profileId}`);
        
      } catch (error) {
        console.error(`Error processing profile ${profileId}:`, error);
        
        // Update status to failed
        await db.collection("pending_profiles").doc(profileId).update({
          status: "failed",
          error: error.message,
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  });