'use client';

import { Scale, FileText, CreditCard, Shield, AlertTriangle, Users, Clock, Ban, Mail, CheckCircle } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Scale className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-400 text-lg">
            Legal terms and conditions for using KlipCam
          </p>
          <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Agreement */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold">Agreement to Terms</h2>
            </div>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using KlipCam ("Service," "Platform," "we," "us," "our"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our service.
            </p>
          </div>
        </section>

        {/* Service Description */}
        <section className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold">Service Description</h2>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-300 mb-4">
              KlipCam is an AI-powered content creation platform that enables users to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-primary-400">Core Features</h3>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Transform photos with AI-powered styles</li>
                  <li>• Generate viral video effects</li>
                  <li>• Create social media content</li>
                  <li>• Train custom character models (LoRA)</li>
                  <li>• Upscale images to Instagram formats</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-secondary-400">Service Model</h3>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Subscription-based service ($9/month)</li>
                  <li>• Credit-based usage system</li>
                  <li>• Free trial with limited credits</li>
                  <li>• Cloud-based AI processing</li>
                  <li>• Multi-device accessibility</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* User Accounts */}
        <section className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">User Accounts & Responsibilities</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-green-400">Account Creation</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• You must be at least 13 years old to use our service</li>
                <li>• Provide accurate and complete information during registration</li>
                <li>• Maintain the security of your account credentials</li>
                <li>• You are responsible for all activities under your account</li>
                <li>• One account per person; no account sharing</li>
              </ul>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Account Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 text-gray-200">Your Responsibilities</h4>
                  <ul className="space-y-1 text-gray-400 text-sm">
                    <li>• Keep login credentials secure</li>
                    <li>• Report unauthorized access immediately</li>
                    <li>• Use strong, unique passwords</li>
                    <li>• Enable two-factor authentication</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-200">Our Protection</h4>
                  <ul className="space-y-1 text-gray-400 text-sm">
                    <li>• Encrypted data transmission</li>
                    <li>• Secure authentication systems</li>
                    <li>• Regular security audits</li>
                    <li>• Fraud detection monitoring</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Acceptable Use */}
        <section className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold">Acceptable Use Policy</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 border border-green-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-400">Permitted Uses</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Personal creative content creation</li>
                <li>• Commercial marketing materials</li>
                <li>• Educational and artistic projects</li>
                <li>• Social media content production</li>
                <li>• Brand and business content</li>
                <li>• Photography enhancement</li>
              </ul>
            </div>
            <div className="bg-gray-900/50 border border-red-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-400">Prohibited Activities</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Uploading NSFW or adult content</li>
                <li>• Creating deepfakes without consent</li>
                <li>• Impersonating celebrities or public figures</li>
                <li>• Generating violent or harmful content</li>
                <li>• Copyright infringement activities</li>
                <li>• Harassment or discriminatory content</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Billing & Payments */}
        <section className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold">Billing & Subscription Terms</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Subscription Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-gray-200">Free Trial</h4>
                  <ul className="space-y-1 text-gray-400 text-sm">
                    <li>• 10 credits included</li>
                    <li>• Watermarked outputs</li>
                    <li>• 30-day content retention</li>
                    <li>• No upscaling feature</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-gray-200">Pro Subscription ($9/month)</h4>
                  <ul className="space-y-1 text-gray-400 text-sm">
                    <li>• 900 credits monthly</li>
                    <li>• No watermarks</li>
                    <li>• Unlimited content retention</li>
                    <li>• Premium features access</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Payment Terms</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Payments processed securely through Stripe</li>
                <li>• Automatic monthly billing on subscription date</li>
                <li>• All fees are non-refundable except as required by law</li>
                <li>• Credits do not roll over between billing periods</li>
                <li>• Price changes require 30-day notice</li>
                <li>• Failed payments may result in service suspension</li>
              </ul>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-orange-400">Cancellation & Refunds</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 text-gray-200">Cancellation</h4>
                  <ul className="space-y-1 text-gray-400 text-sm">
                    <li>• Cancel anytime through account settings</li>
                    <li>• Access continues until period end</li>
                    <li>• No early termination fees</li>
                    <li>• Unused credits forfeit upon cancellation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-200">Refund Policy</h4>
                  <ul className="space-y-1 text-gray-400 text-sm">
                    <li>• Generally no refunds provided</li>
                    <li>• Exceptions for service failures</li>
                    <li>• Dispute resolution through support</li>
                    <li>• Chargeback protection measures</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold">Intellectual Property</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-indigo-400">Your Content Rights</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• You retain ownership of your uploaded images and generated content</li>
                <li>• You grant us limited rights to process and store your content</li>
                <li>• You must own or have permission for all uploaded materials</li>
                <li>• Generated content is yours to use commercially and personally</li>
              </ul>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-purple-400">Our Platform Rights</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• KlipCam platform, technology, and branding are our property</li>
                <li>• AI models and algorithms are licensed from third parties</li>
                <li>• You may not reverse engineer or copy our technology</li>
                <li>• Our content and materials are protected by copyright</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/10 to-red-500/10 border border-yellow-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-400">Copyright Infringement</h3>
              </div>
              <p className="text-gray-300 mb-3">
                We respect intellectual property rights and expect users to do the same:
              </p>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>• Do not upload copyrighted material without permission</li>
                <li>• Report copyright violations to dmca@klipcam.com</li>
                <li>• We will respond to valid DMCA takedown notices</li>
                <li>• Repeat infringers may have accounts terminated</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Service Availability */}
        <section className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">Service Availability & Limitations</h2>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-green-400">Service Levels</h3>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Best-effort availability (no SLA guarantee)</li>
                  <li>• Scheduled maintenance windows</li>
                  <li>• Performance depends on AI service providers</li>
                  <li>• Queue management during high demand</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-blue-400">Usage Limits</h3>
                <ul className="space-y-1 text-gray-300 text-sm">
                  <li>• Maximum 2 concurrent jobs per user</li>
                  <li>• 10MB maximum file size</li>
                  <li>• Credit-based usage restrictions</li>
                  <li>• Rate limiting for API protection</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy & Data */}
        <section className="mb-12">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Privacy & Data Handling</h2>
            <p className="text-gray-300 mb-3">
              Your privacy is important to us. Our data handling practices are detailed in our Privacy Policy, including:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>• Personal information collection and use</li>
                <li>• Image processing and storage</li>
                <li>• Third-party service integration</li>
                <li>• Data retention and deletion</li>
              </ul>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>• User rights and controls</li>
                <li>• Cookie usage and tracking</li>
                <li>• International data transfers</li>
                <li>• Security measures and compliance</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Termination */}
        <section className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Ban className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold">Account Termination</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-red-400">Termination by User</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Cancel your subscription anytime through account settings</li>
                <li>• Account remains active until the end of the billing period</li>
                <li>• Content may be deleted after account closure</li>
                <li>• No refunds for unused credits or partial periods</li>
              </ul>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-orange-400">Termination by KlipCam</h3>
              <p className="text-gray-300 mb-3">We may suspend or terminate your account for:</p>
              <ul className="space-y-2 text-gray-300">
                <li>• Violation of these Terms of Service</li>
                <li>• Prohibited content creation or sharing</li>
                <li>• Payment failures or fraudulent activity</li>
                <li>• Abuse of our platform or other users</li>
                <li>• Legal or regulatory requirements</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6">
              <p className="text-gray-300">
                <strong className="text-red-400">Upon termination:</strong> Your access will be revoked immediately, generated content may be deleted, and any outstanding payments become due. We may retain certain information as required by law or for legitimate business purposes.
              </p>
            </div>
          </div>
        </section>

        {/* Disclaimers & Liability */}
        <section className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold">Disclaimers & Limitation of Liability</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">Service Disclaimers</h3>
              <p className="text-gray-300 mb-3">
                KlipCam is provided "as is" without warranties of any kind:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• We don't guarantee specific results or quality levels</li>
                <li>• AI-generated content may contain errors or artifacts</li>
                <li>• Service availability and performance may vary</li>
                <li>• Third-party AI services may experience outages</li>
                <li>• Generated content reflects training data patterns and biases</li>
              </ul>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-red-400">Limitation of Liability</h3>
              <p className="text-gray-300 mb-3">
                To the maximum extent permitted by law, our liability is limited to:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• The amount you paid for the service in the past 12 months</li>
                <li>• We are not liable for indirect, incidental, or consequential damages</li>
                <li>• You use the service at your own risk</li>
                <li>• Some jurisdictions may not allow certain liability limitations</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Governing Law */}
        <section className="mb-12">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Governing Law & Disputes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-blue-400">Jurisdiction</h3>
                <p className="text-gray-300 text-sm">
                  These terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved in the courts of [Your Jurisdiction].
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-green-400">Dispute Resolution</h3>
                <p className="text-gray-300 text-sm">
                  We encourage resolving disputes through direct communication before pursuing legal action. Contact our support team for assistance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Changes */}
        <section className="mb-12">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Mail className="w-6 h-6 text-primary-400" />
                <h2 className="text-xl font-bold">Contact Information</h2>
              </div>
              <p className="text-gray-300 mb-3">
                Questions about these Terms of Service? Contact us:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-primary-400">General Inquiries</h3>
                  <ul className="space-y-1 text-gray-400 text-sm">
                    <li>• Email: legal@klipcam.com</li>
                    <li>• Response time: 3-5 business days</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-secondary-400">Urgent Legal Matters</h3>
                  <ul className="space-y-1 text-gray-400 text-sm">
                    <li>• Email: urgent-legal@klipcam.com</li>
                    <li>• Response time: 24-48 hours</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Changes to Terms</h2>
              <p className="text-gray-300">
                We may modify these Terms of Service at any time. Significant changes will be communicated via email or platform notifications. Continued use of the service after changes indicates acceptance of the new terms. We recommend reviewing these terms periodically.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}