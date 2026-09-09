# Authentication

The sign-in, registration, recovery, reset, and onboarding interfaces live in `src/pages/AuthPages.tsx`.

Forms validate and communicate their pending state without creating a local or simulated session. Authentication, secure cookies, token rotation, authorization, and approved consent storage remain Go-owned integration work.
