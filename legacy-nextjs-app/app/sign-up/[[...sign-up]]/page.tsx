import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Join KlipCam</h1>
          <p className="text-gray-400">Create your account and start generating amazing content</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-gray-900/80 backdrop-blur border border-gray-800 shadow-2xl",
            }
          }}
        />
      </div>
    </div>
  );
}