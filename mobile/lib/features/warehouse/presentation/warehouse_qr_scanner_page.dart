import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../core/widgets/sign_out_button.dart';
import '../data/tracking_code.dart';

/// Scans one tracking code and returns it to the intake page. It deliberately
/// performs no API request and preserves the code's original case.
class WarehouseQrScannerPage extends StatefulWidget {
  const WarehouseQrScannerPage({super.key});

  @override
  State<WarehouseQrScannerPage> createState() => _WarehouseQrScannerPageState();
}

class _WarehouseQrScannerPageState extends State<WarehouseQrScannerPage> {
  final _controller = MobileScannerController();
  bool _handled = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handled) return;
    final rawValue = capture.barcodes.firstOrNull?.rawValue;
    if (rawValue == null) return;
    final code = TrackingCode.normalize(rawValue);
    final error = TrackingCode.validate(code);
    if (error != null) {
      setState(() => _error = error);
      return;
    }
    _handled = true;
    await _controller.stop();
    if (mounted) context.pop(code);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan tracking code'),
        actions: const [SignOutButton()],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              minimum: const EdgeInsets.all(20),
              child: Container(
                padding: const EdgeInsets.all(14),
                color: Colors.black87,
                child: Text(
                  _error ?? 'Center the QR code or barcode in the camera view.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
