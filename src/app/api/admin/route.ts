// In: satellite-app/src/app/api/admin/route.ts
import { adminAuth } from '@/lib/firebase/admin-config'; // Or your admin config path
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split('Bearer ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // --- THIS IS THE DEBUGGING LOG ---
    console.log('[SATELLITE APP LOG] Decoded token claims:', decodedToken);
    
    // --- THIS IS THE FIX ---
    // Allow access if the user is an admin OR a superAdmin.
    if (!decodedToken.admin && !decodedToken.superAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: User does not have admin or superAdmin privileges' },
        { status: 403 }
      );
    }
    // ----------------------

    // If we are here, the user is authorized.

    const validate = req.nextUrl.searchParams.get('validate');
    if (validate === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Connection successful. Authenticated as admin/superAdmin.',
      });
    }

    return NextResponse.json({ success: true, message: 'Admin action successful.' });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
  }
}
