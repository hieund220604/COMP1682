import 'package:flutter/material.dart';
import 'package:splitpay/core/widgets/authorized_app_shell.dart';

class WelcomePage extends StatefulWidget {
  const WelcomePage({super.key});

  @override
  State<WelcomePage> createState() => _WelcomePageState();
}

class _WelcomePageState extends State<WelcomePage> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final int _totalPages = 5; // 4 content pages + 1 placeholder

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onSkip() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const AuthorizedAppShell()),
    );
  }

  void _onNext() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      // Finish onboarding
      _onSkip();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // Most backgrounds are white/light
      body: SafeArea(
        child: Stack(
          children: [
            // Page Content
            PageView(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() {
                  _currentPage = index;
                });
              },
              children: const [
                // Page 1: Welcome Alex (Red Abstract)
                WelcomeContentPage1(),
                // Page 2: Welcome SplitPal (Features)
                WelcomeContentPage2(),
                // Page 3: Track Expenses (Living Room)
                WelcomeContentPage3(),
                // Page 4: Manage Subscriptions (UI Mockup)
                WelcomeContentPage4(),
                // Page 5: Placeholder
                WelcomeContentPage5(), 
              ],
            ),

            // Top Bar: Back (optional) and Skip
            Positioned(
              top: 16,
              left: 24,
              right: 24,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Show logo on some screens? 
                  // For coherence, let's keep Skip button consistent
                  if (_currentPage > 0) // Maybe verify if back needed?
                    const SizedBox.shrink() // Or logo
                  else
                    const SizedBox.shrink(),
                    
                  // Skip Button always visible? Yes per request
                  GestureDetector(
                    onTap: _onSkip,
                    child: const Text(
                      'Skip',
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Fixed Logo on Top Left for some screens (like Page 5/Subscription)
            if (_currentPage == 3 || _currentPage == 4) // Example logic, adjust as needed
             Positioned(
               top: 16,
               left: 24,
               child: Row(
                 children: [
                   Container(
                     padding: const EdgeInsets.all(4),
                     decoration: const BoxDecoration(color: Color(0xFFE85D4E), shape: BoxShape.circle),
                     child: const Icon(Icons.pie_chart, color: Colors.white, size: 16),
                   ),
                   const SizedBox(width: 8),
                   const Text(
                     'SplitPal', 
                     style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1F2C37)),
                   ),
                 ],
               ),
             ),
          ],
        ),
      ),
      // Bottom Navigation Area (Dots + Button)
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(24),
        color: Colors.white,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Dots Indicator
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_totalPages, (index) {
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  height: 8,
                  width: _currentPage == index ? 24 : 8,
                  decoration: BoxDecoration(
                    color: _currentPage == index ? const Color(0xFFE85D4E) : Colors.grey[300],
                    borderRadius: BorderRadius.circular(4),
                  ),
                );
              }),
            ),
            const SizedBox(height: 24),
            
            // Primary Action Button (Different per page, but can be unified container)
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _onNext,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE85D4E),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _getPageButtonText(_currentPage),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    if (_currentPage > 0) ...[ // Arrow on later pages
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward, color: Colors.white),
                    ]
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getPageButtonText(int pageIndex) {
    switch (pageIndex) {
      case 0: return 'Get Started';
      case 1: return 'Start Exploring';
      case 2: return 'Get Started'; // Or 'Continue' based on image 3
      case 3: return 'Continue';
      default: return 'Finish';
    }
  }
}

// --- Page Content Widgets ---

// 1. Welcome Alex
class WelcomeContentPage1 extends StatelessWidget {
  const WelcomeContentPage1({super.key});
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // 3D Red Abstract Image Placeholder
        Container(
          height: 300,
          width: 300,
          decoration: BoxDecoration(
             color: const Color(0xFFE85D4E),
             borderRadius: BorderRadius.circular(24),
          ),
          child: const Center(child: Icon(Icons.view_in_ar, size: 100, color: Colors.white)),
        ),
        const SizedBox(height: 40),
        const Text(
          'Welcome to SplitPal,\nAlex!',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2C37),
            height: 1.2,
          ),
        ),
        const SizedBox(height: 16),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            'Track subscriptions, split bills, and settle\nup in seconds. Let\'s start managing shared\nexpenses with your friends and\nroommates effortlessly.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey, height: 1.5),
          ),
        ),
      ],
    );
  }
}

// 2. Welcome SplitPal (3 Features)
class WelcomeContentPage2 extends StatelessWidget {
  const WelcomeContentPage2({super.key});
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
         // 3D Molecule Image Placeholder
        Container(
          height: 250,
          width: 250,
          decoration: BoxDecoration(
             color: const Color(0xFFE6DCCD), // Beige-ish bg from image
             borderRadius: BorderRadius.circular(24),
          ),
          child: const Center(child: Icon(Icons.bubble_chart, size: 100, color: Color(0xFFE85D4E))),
        ),
        const SizedBox(height: 32),
        const Text(
          'Welcome to SplitPal!',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2C37),
          ),
        ),
        const SizedBox(height: 12),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'Let\'s get your finances organized, Alex.\nReady to split bills without the headache?',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey, height: 1.5),
          ),
        ),
        const SizedBox(height: 32),
        // Feature Icons
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildFeatureItem(Icons.receipt_long, 'Track\nExpenses'),
            _buildFeatureItem(Icons.subscriptions, 'Manage\nSubs'),
            _buildFeatureItem(Icons.group, 'Sync\nFriends'),
          ],
        ),
      ],
    );
  }

  Widget _buildFeatureItem(IconData icon, String label) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.red[50],
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: const Color(0xFFE85D4E), size: 28),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        ),
      ],
    );
  }
}

// 3. Track expenses effortlessly (People illustration)
class WelcomeContentPage3 extends StatelessWidget {
  const WelcomeContentPage3({super.key});
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Illustration Placeholder
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 24),
          height: 300,
          decoration: BoxDecoration(
             color: const Color(0xFFFFF3E0), 
             borderRadius: BorderRadius.circular(24),
          ),
          child: const Center(child: Icon(Icons.people, size: 100, color: Colors.orange)),
        ),
        const SizedBox(height: 40),
        const Text(
          'Track expenses effortlessly',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2C37),
          ),
        ),
        const SizedBox(height: 16),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            'Seamlessly monitor rent, utilities, and\nsubscriptions with precise real-time updates.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey, height: 1.5),
          ),
        ),
      ],
    );
  }
}

// 4. Manage Subscriptions (UI Mockup)
class WelcomeContentPage4 extends StatelessWidget {
  const WelcomeContentPage4({super.key});
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Subscriptions UI Mockup Placeholder
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 24),
          height: 320,
          decoration: BoxDecoration(
             color: Colors.white,
             borderRadius: BorderRadius.circular(24),
             boxShadow: [
               BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10)),
             ],
             border: Border.all(color: Colors.grey[100]!),
          ),
          child: Column(
             mainAxisAlignment: MainAxisAlignment.center,
             children: [
               // Mock Content similar to image
               _buildMockSubRow(Icons.music_note, 'Spotify', '\$9.99', true),
               _buildMockSubRow(Icons.movie, 'Netflix', '\$15.99', false),
             ],
          ),
        ),
        const SizedBox(height: 40),
        const Text(
          'Manage Subscriptions',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2C37),
          ),
        ),
        const SizedBox(height: 16),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            'Stop chasing roommates for their share.\nTrack family plans and recurring digital\nservices in one professional dashboard.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey, height: 1.5),
          ),
        ),
      ],
    );
  }
  
  Widget _buildMockSubRow(IconData icon, String name, String price, bool active) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: active ? const Color(0xFFE85D4E) : Colors.grey[200],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: active ? Colors.white : Colors.grey),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
               Container(width: 80, height: 10, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(5))),
               const SizedBox(height: 8),
               Container(width: 50, height: 8, decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(4))),
            ],
          ),
          const Spacer(),
          Text(price, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFE85D4E))),
        ],
      ),
    );
  }
}

// 5. Placeholder Page
class WelcomeContentPage5 extends StatelessWidget {
  const WelcomeContentPage5({super.key});
  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          height: 250,
          width: 250,
          decoration: BoxDecoration(
             color: Colors.blue[50],
             shape: BoxShape.circle,
          ),
          child: const Center(child: Icon(Icons.rocket_launch, size: 100, color: Colors.blue)),
        ),
        const SizedBox(height: 40),
        const Text(
          'Ready for Blastoff!',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2C37),
          ),
        ),
        const SizedBox(height: 16),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            'Your final step to financial freedom starts here.\nJoin thousands of other smart users.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey, height: 1.5),
          ),
        ),
      ],
    );
  }
}
