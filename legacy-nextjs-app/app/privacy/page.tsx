'use client';

import { Shield, Calendar, Mail, Eye, Lock, Users, Globe, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-primary-500/20 rounded-lg">
              <Shield className="w-8 h-8 text-primary-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-400 text-lg">
            How KlipCam collects, uses, and protects your information
          </p>
          <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          
          {/* Introduction */}
          <section className="mb-12">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 leading-relaxed">
                At MILIVON, we take your privacy seriously. This Privacy Policy describes how KlipCam ("the App", "we", "our", "us") collects, uses, and protects your information. Our app is designed with privacy-first principles to protect your data while providing AI-powered content creation services.
              </p>
            </div>
          </section>

          {/* Privacy-First Design */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Lock className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">1. Privacy-First Design</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">KlipCam is built with privacy as a core principle:</p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-green-400">Secure authentication:</strong> User accounts managed securely through Clerk authentication service</li>
                <li>• <strong className="text-green-400">Encrypted data:</strong> All data transmission uses industry-standard encryption</li>
                <li>• <strong className="text-green-400">Minimal collection:</strong> We collect only what's necessary for app functionality</li>
                <li>• <strong className="text-green-400">User control:</strong> You maintain control over your generated content and account data</li>
              </ul>
            </div>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">2. Information We Collect</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-primary-400">Account Information</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• <strong>Personal details:</strong> Name, email address provided during account creation</li>
                  <li>• <strong>Authentication data:</strong> Securely managed through Clerk authentication service</li>
                  <li>• <strong>Profile information:</strong> Optional profile photos and preferences</li>
                  <li>• <strong>Subscription data:</strong> Plan type, billing information processed through Stripe</li>
                </ul>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-secondary-400">Usage Information</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• <strong>Device information:</strong> Browser type, operating system, device identifiers</li>
                  <li>• <strong>Usage analytics:</strong> Features used, generation requests, credit consumption</li>
                  <li>• <strong>Technical data:</strong> App version, performance metrics, error logs</li>
                  <li>• <strong>Content creation:</strong> Images uploaded for AI processing, generated content metadata</li>
                </ul>
              </div>
            </div>
          </section>

          {/* AI Content Generation */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold">3. AI Content Generation and Processing</h2>
            </div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">KlipCam uses artificial intelligence to generate and modify images. When you use our AI features:</p>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">AI-Generated Content</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• All output images are created or modified using artificial intelligence models</li>
                    <li>• Generated content is clearly marked as "AI-Generated" within the app</li>
                    <li>• Content reflects AI model training patterns and may contain biases</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-pink-400 mb-2">Image Processing</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Images are temporarily sent to third-party AI services (Replicate, FAL AI) for processing</li>
                    <li>• Images are automatically deleted from AI service servers after processing</li>
                    <li>• Your images are not used to train or improve AI models</li>
                    <li>• Processing occurs only when you actively request AI generation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-400 mb-2">Content Storage</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Generated content is stored in our secure Supabase storage system</li>
                    <li>• Trial users' content is retained for 30 days</li>
                    <li>• Paid subscribers' content is retained for the duration of their subscription</li>
                    <li>• You can delete your generated content at any time</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Globe className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold">4. Third-Party AI Services</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">We use the following third-party services to provide our functionality:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-orange-400">AI Processing</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• <strong>Replicate:</strong> AI image and video generation</li>
                    <li>• <strong>FAL AI:</strong> Fast AI model training and inference</li>
                    <li>• Temporary image processing only</li>
                    <li>• Automatic deletion after processing</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-400">Platform Services</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• <strong>Clerk:</strong> User authentication and management</li>
                    <li>• <strong>Stripe:</strong> Secure payment processing</li>
                    <li>• <strong>Supabase:</strong> Database and file storage</li>
                    <li>• <strong>Resend:</strong> Transactional email delivery</li>
                  </ul>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                These services have their own privacy policies and data handling practices. Your data is only sent to these services when necessary for app functionality.
              </p>
            </div>
          </section>

          {/* Credit System */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold">5. Credit System and Purchases</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">Our credit-based system works as follows:</p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-yellow-400">Credit tracking:</strong> Your credit balance is stored securely in our database</li>
                <li>• <strong className="text-yellow-400">Purchase processing:</strong> Payments handled securely through Stripe</li>
                <li>• <strong className="text-yellow-400">Subscription management:</strong> Automatic credit grants upon successful payment</li>
                <li>• <strong className="text-yellow-400">Usage tracking:</strong> Detailed logs of credit consumption for transparency</li>
                <li>• <strong className="text-yellow-400">No financial data storage:</strong> Payment information handled exclusively by Stripe</li>
              </ul>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">6. Data Retention and Storage</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-indigo-400">Account Data</h4>
                    <ul className="space-y-1 text-gray-300 text-sm">
                      <li>• Profile information retained while account is active</li>
                      <li>• Deletion available through account settings</li>
                      <li>• 30-day grace period before permanent deletion</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-purple-400">Generated Content</h4>
                    <ul className="space-y-1 text-gray-300 text-sm">
                      <li>• Trial users: 30-day retention</li>
                      <li>• Paid users: Duration of subscription</li>
                      <li>• User-controlled deletion available</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy Rights */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">7. Your Privacy Rights</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">You have complete control over your data:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-green-400">Data Control</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Access and download your data</li>
                    <li>• Correct inaccurate information</li>
                    <li>• Delete specific content or entire account</li>
                    <li>• Control data sharing preferences</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-400">Communication Preferences</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Opt-out of marketing emails</li>
                    <li>• Manage notification settings</li>
                    <li>• Control account-related communications</li>
                    <li>• Request data portability</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold">8. Data Security</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">We implement comprehensive security measures to protect your information:</p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-red-400">Encryption:</strong> All data transmission uses HTTPS/TLS encryption</li>
                <li>• <strong className="text-red-400">Authentication:</strong> Secure user authentication through Clerk</li>
                <li>• <strong className="text-red-400">Access controls:</strong> Strict database access controls and monitoring</li>
                <li>• <strong className="text-red-400">Regular audits:</strong> Periodic security assessments and updates</li>
                <li>• <strong className="text-red-400">Incident response:</strong> Procedures for handling security events</li>
              </ul>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-yellow-400">9. Children's Privacy and AI Content</h2>
              <p className="text-gray-300 mb-3">
                Our app does not knowingly collect personal information from children under 13. Due to AI content generation capabilities:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-yellow-400">Age Restriction:</strong> Users should not upload images of anyone under 18 years of age</li>
                <li>• <strong className="text-yellow-400">Parental Guidance:</strong> Parents should supervise children's use of AI generation features</li>
                <li>• <strong className="text-yellow-400">Content Appropriateness:</strong> AI-generated content may not always be suitable for all ages</li>
                <li>• <strong className="text-yellow-400">Account Requirements:</strong> Users must be 13+ to create accounts</li>
              </ul>
            </div>
          </section>

          {/* Policy Updates */}
          <section className="mb-12">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-300">
                We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this policy and notify users of significant changes via email or app notifications. Continued use of the app after changes constitutes acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <Mail className="w-5 h-5 text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold">11. Contact Us</h2>
            </div>
            <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-primary-400">General Privacy Questions</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• <strong>Company:</strong> MILIVON</li>
                    <li>• <strong>Email:</strong> privacy@milivon.com</li>
                    <li>• <strong>Website:</strong> www.milivon.com</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-secondary-400">Data Requests</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• <strong>Data requests:</strong> data-requests@milivon.com</li>
                    <li>• <strong>Response time:</strong> Within 30 days</li>
                    <li>• <strong>GDPR inquiries:</strong> gdpr@milivon.com</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section className="mb-12">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">12. Governing Law</h2>
              <p className="text-gray-300">
                This Privacy Policy is governed by applicable data protection laws. For users in the European Union, this policy complies with GDPR requirements. For users in California, we comply with the California Consumer Privacy Act (CCPA) requirements.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}