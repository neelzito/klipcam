'use client';

import { Brain, Shield, AlertTriangle, Eye, Users, Zap, Settings, FileX, Camera, Video } from 'lucide-react';

export default function AIPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-secondary-500/20 rounded-lg">
              <Brain className="w-8 h-8 text-secondary-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">AI Content Policy</h1>
          <p className="text-gray-400 text-lg">
            Understanding AI-Generated Content in KlipCam
          </p>
          <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-500">
            <Settings className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-1 w-6 h-6" />
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Important: AI-Generated Content</h3>
              <p className="text-gray-300">
                All images and videos created or modified by KlipCam use artificial intelligence. Generated content should be clearly identified as AI-created when shared and should not be presented as authentic photographs or videos.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          
          {/* What is AI-Generated Content */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Brain className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">1. What is AI-Generated Content?</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">KlipCam uses advanced artificial intelligence models to create and modify images and videos. This means:</p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-blue-400">Artificial Creation:</strong> All output content is generated or modified by computer algorithms, not captured by cameras</li>
                <li>• <strong className="text-blue-400">Based on Training Data:</strong> AI models are trained on large datasets to learn patterns and styles</li>
                <li>• <strong className="text-blue-400">Interpretation, Not Reality:</strong> Generated content represents an AI's interpretation of your request, not factual reality</li>
                <li>• <strong className="text-blue-400">Clearly Labeled:</strong> All AI-generated content in the app is marked with ✨ AI-Generated labels</li>
              </ul>
            </div>
          </section>

          {/* How Our AI Works */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold">2. How Our AI Features Work</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-primary-400 flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Photo Style Transformations
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Transforms your photo into professional-style portraits</li>
                  <li>• Changes lighting, background, and styling elements</li>
                  <li>• Maintains facial features while enhancing presentation</li>
                  <li>• Creates Instagram-ready content from casual selfies</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-secondary-400 flex items-center">
                  <Video className="w-5 h-5 mr-2" />
                  Viral Video Effects
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Adds dynamic animation effects to your photos</li>
                  <li>• Creates 3-second vertical videos perfect for TikTok and Instagram</li>
                  <li>• Effects like Earth Zoom Out, Explosion, Paint Splash</li>
                  <li>• Results are artistic interpretations optimized for social media</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-green-400 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Custom Character Training (LoRA)
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Train custom AI models of yourself or characters</li>
                  <li>• Requires 4-20 high-quality training images</li>
                  <li>• Creates personalized AI models for consistent content generation</li>
                  <li>• Training is an educated process, results may vary</li>
                </ul>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-orange-400 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Image Upscaling
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• AI-powered upscaling to Instagram-ready formats</li>
                  <li>• Enhances resolution and quality intelligently</li>
                  <li>• Optimizes images for social media platforms</li>
                  <li>• Creates higher resolution from lower quality inputs</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Responsible Use Guidelines */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">3. Responsible Use Guidelines</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-green-400">✅ Appropriate Uses</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Personal social media content creation</li>
                  <li>• Creative projects and artistic exploration</li>
                  <li>• Marketing materials for your business</li>
                  <li>• Content creator portfolio development</li>
                  <li>• Experimenting with different visual styles</li>
                  <li>• Fun, clearly-labeled AI content for social sharing</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-red-400">❌ Prohibited Uses</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Creating fake identification documents</li>
                  <li>• Generating misleading representations without consent</li>
                  <li>• Creating content intended to deceive or manipulate</li>
                  <li>• Producing inappropriate, illegal, or harmful content</li>
                  <li>• Processing images of people under 18 years old</li>
                  <li>• Violating others' privacy or likeness rights</li>
                </ul>
              </div>
            </div>
          </section>

          {/* AI Limitations */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold">4. Understanding AI Limitations</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">AI-generated content has inherent limitations you should understand:</p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-yellow-400">Accuracy:</strong> Results may not accurately represent how you would actually look in real life</li>
                <li>• <strong className="text-yellow-400">Bias:</strong> AI models may reflect biases present in their training data</li>
                <li>• <strong className="text-yellow-400">Inconsistency:</strong> Similar inputs may produce different results across generations</li>
                <li>• <strong className="text-yellow-400">Quality Variation:</strong> Output quality depends on input image quality and prompt complexity</li>
                <li>• <strong className="text-yellow-400">Cultural Context:</strong> AI may not understand cultural or personal significance</li>
                <li>• <strong className="text-yellow-400">Artifacts:</strong> Generated content may contain visual imperfections or unrealistic elements</li>
              </ul>
            </div>
          </section>

          {/* Sharing AI Content */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <Eye className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">5. Sharing AI-Generated Content</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">When sharing content created with KlipCam:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-indigo-400">Disclosure Requirements</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Always label content as AI-generated</li>
                    <li>• Use hashtags like #AIGenerated or #KlipCam</li>
                    <li>• Include context about the creation process</li>
                    <li>• Be transparent about AI involvement</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-purple-400">Platform Considerations</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Follow each platform's AI content policies</li>
                    <li>• Consider how audiences might interpret content</li>
                    <li>• Respect community guidelines</li>
                    <li>• Use platform-specific AI disclosure features</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy and Processing */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-pink-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-pink-400" />
              </div>
              <h2 className="text-2xl font-bold">6. Privacy and AI Processing</h2>
            </div>
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">Your privacy is protected during AI processing:</p>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h4 className="font-semibold text-pink-400 mb-2">Processing Security</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Images are only temporarily sent to AI services for processing</li>
                    <li>• Automatic deletion from AI service providers after completion</li>
                    <li>• Secure transmission using industry-standard encryption</li>
                    <li>• No permanent storage on third-party AI servers</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-400 mb-2">Data Usage</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Your images are not used to train or improve AI models</li>
                    <li>• Processing occurs only when you actively request generation</li>
                    <li>• Generated images are stored securely in your account</li>
                    <li>• You maintain control over all generated content</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Content Moderation */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold">7. Content Moderation & Safety</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">We implement multiple safeguards to prevent misuse:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-red-400">Automated Systems</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Content filtering to prevent inappropriate material</li>
                    <li>• NSFW detection on uploaded images</li>
                    <li>• Automated safety checks on generated content</li>
                    <li>• Model-level restrictions and guidelines</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-orange-400">Monitoring & Response</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Usage pattern monitoring for abuse detection</li>
                    <li>• User reporting system for concerning content</li>
                    <li>• Regular AI model updates for improved safety</li>
                    <li>• Account restrictions for policy violations</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Age and Consent */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-yellow-500/10 to-red-500/10 border border-yellow-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-yellow-400">8. Age and Consent Requirements</h2>
              </div>
              <div className="space-y-3">
                <p className="text-gray-300"><strong className="text-yellow-400">Important Age Restrictions:</strong></p>
                <ul className="space-y-2 text-gray-300">
                  <li>• <strong className="text-red-400">Prohibited:</strong> Do not upload images of anyone under 18 years old</li>
                  <li>• <strong className="text-orange-400">Consent Required:</strong> Obtain explicit consent before processing others' photos</li>
                  <li>• <strong className="text-yellow-400">Supervision:</strong> Parents should supervise children's use of AI features</li>
                  <li>• <strong className="text-blue-400">Ethics:</strong> Consider the implications of generating content of real people</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Commercial Use */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">9. Commercial Use Guidelines</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">For commercial or professional use of AI-generated content:</p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-blue-400">Usage Rights:</strong> Subscribers can use generated content commercially</li>
                <li>• <strong className="text-blue-400">Disclosure Required:</strong> Always disclose AI generation to clients or audiences</li>
                <li>• <strong className="text-blue-400">Legal Compliance:</strong> Ensure compliance with advertising and media laws</li>
                <li>• <strong className="text-blue-400">Professional Standards:</strong> Follow industry standards for AI-generated content</li>
                <li>• <strong className="text-blue-400">Client Agreements:</strong> Include AI usage terms in client contracts</li>
              </ul>
            </div>
          </section>

          {/* Reporting Misuse */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-bold">10. Reporting AI Misuse</h2>
              </div>
              <p className="text-gray-300 mb-4">
                If you encounter misuse of our AI technology or inappropriate content generation:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2 text-red-400">Contact Methods</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Email: abuse@milivon.com</li>
                    <li>• In-app reporting feature</li>
                    <li>• Response within 24 hours</li>
                    <li>• Anonymous reporting available</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-orange-400">Information to Include</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Detailed description of the issue</li>
                    <li>• Screenshots or evidence if available</li>
                    <li>• Your contact information</li>
                    <li>• Specific policy violations observed</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Educational Resources */}
          <section className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Settings className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">11. Educational Resources</h2>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <p className="text-gray-300 mb-4">Learn more about AI and responsible use:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-green-400">Understanding AI</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• AI ethics and responsible creation</li>
                    <li>• How AI models learn and generate content</li>
                    <li>• Identifying AI-generated content</li>
                    <li>• Digital literacy in the AI age</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-400">Legal & Social</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Laws governing AI-generated content</li>
                    <li>• Industry best practices and guidelines</li>
                    <li>• Social impact of AI content creation</li>
                    <li>• Platform-specific AI policies</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Policy Updates */}
          <section className="mb-12">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">12. Policy Updates</h2>
              <p className="text-gray-300">
                This AI Content Policy may be updated as technology, regulations, and best practices evolve. We will notify users of significant changes via email or app notifications and update the "Last updated" date above. Continued use of KlipCam after updates constitutes acceptance of the revised policy.
              </p>
            </div>
          </section>

          {/* Contact and Support */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">13. Contact and Support</h2>
              <p className="text-gray-300 mb-4">For questions about AI content generation or this policy:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 text-primary-400">AI Policy Questions</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• <strong>Email:</strong> ai-policy@milivon.com</li>
                    <li>• <strong>General Support:</strong> support@milivon.com</li>
                    <li>• <strong>Website:</strong> www.milivon.com</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-secondary-400">Legal & Compliance</h4>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• <strong>Legal Inquiries:</strong> legal@milivon.com</li>
                    <li>• <strong>Abuse Reports:</strong> abuse@milivon.com</li>
                    <li>• <strong>Response Time:</strong> 24-48 hours</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}