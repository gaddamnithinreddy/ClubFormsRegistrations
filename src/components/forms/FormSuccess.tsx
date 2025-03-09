import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

interface FormSuccessProps {
  formId: string;
  formUrl: string;
}

export function FormSuccess({ formId, formUrl }: FormSuccessProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full animate-scale-up">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500 animate-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Form Created Successfully!</h2>
          <p className="text-gray-600 mb-6">Your form is now ready to be shared</p>
          <div className="space-y-4 w-full">
            <Link
              to={`/forms/${formId}`}
              className="block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              View Form
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}