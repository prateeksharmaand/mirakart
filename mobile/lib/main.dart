import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';

import 'core/theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  await Firebase.initializeApp();

  runApp(const ProviderScope(child: MirakartApp()));
}

class MirakartApp extends StatelessWidget {
  const MirakartApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mirakart',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      // Routing (GoRouter) is wired in once the Authentication and Home
      // modules are implemented — see docs/architecture.md.
      home: const Scaffold(body: Center(child: CircularProgressIndicator())),
    );
  }
}
