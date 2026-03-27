import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './src/config/firebase';

async function repairOrgs() {
    console.log('Starting organization repair...');
    const orgsSnap = await getDocs(collection(db, 'organizations'));
    console.log(`Found ${orgsSnap.size} organizations.`);

    for (const orgDoc of orgsSnap.docs) {
        const orgData = orgDoc.data();
        if (orgData.isOwnerAdmin !== undefined) {
            console.log(`Org ${orgDoc.id} already has isOwnerAdmin: ${orgData.isOwnerAdmin}. Skipping.`);
            continue;
        }

        const ownerId = orgData.ownerId;
        if (!ownerId) {
            console.log(`Org ${orgDoc.id} has no ownerId!`);
            continue;
        }

        const userSnap = await getDoc(doc(db, 'users', ownerId));
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const isAdmin = userData.userType === 'admin' || userData.userType === 'super-admin';
            await updateDoc(orgDoc.ref, { isOwnerAdmin: isAdmin });
            console.log(`Updated Org ${orgDoc.id} (Owner: ${userData.userType}) -> isOwnerAdmin: ${isAdmin}`);
        } else {
            console.log(`Owner ${ownerId} for Org ${orgDoc.id} not found.`);
        }
    }
    console.log('Repair complete.');
}

repairOrgs();
