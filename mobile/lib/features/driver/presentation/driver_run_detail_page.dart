import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:convert';
import 'dart:io';

import '../data/driver_repository.dart';
import '../data/models/driver_models.dart';

class DriverRunDetailPage extends ConsumerStatefulWidget {
  const DriverRunDetailPage({super.key, required this.shipmentId});
  final String shipmentId;

  @override
  ConsumerState<DriverRunDetailPage> createState() => _DriverRunDetailPageState();
}

class _DriverRunDetailPageState extends ConsumerState<DriverRunDetailPage> {
  bool _isSubmitting = false;

  Future<void> _handleStartRun() async {
    setState(() => _isSubmitting = true);
    try {
      await ref.read(driverRepositoryProvider).startRun(widget.shipmentId);
      ref.invalidate(driverRunDetailProvider(widget.shipmentId));
      ref.invalidate(driverRunsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Run opened — parcels picked up.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to open run: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _handleRecordEvent(String stopKey, String kind) async {
    setState(() => _isSubmitting = true);
    try {
      final repo = ref.read(driverRepositoryProvider);
      await repo.recordEvent(widget.shipmentId, stopKey: stopKey, kind: kind);
      ref.invalidate(driverRunDetailProvider(widget.shipmentId));
      ref.invalidate(driverRunsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Stop marked as ${kind == "ARRIVED" ? "Arrived" : "En Route"}.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update stop: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _openPodSheet(TimelineEntry stop) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _PodFormBottomSheet(
        shipmentId: widget.shipmentId,
        stop: stop,
        onSubmit: (receivedByName, notes, photoBase64) async {
          Navigator.pop(ctx);
          setState(() => _isSubmitting = true);
          try {
            final repo = ref.read(driverRepositoryProvider);
            await repo.proofOfDelivery(
              widget.shipmentId,
              stopKey: stop.stopKey,
              receivedByName: receivedByName,
              notes: notes,
              photoUrl: photoBase64,
            );
            ref.invalidate(driverRunDetailProvider(widget.shipmentId));
            ref.invalidate(driverRunsProvider);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Proof of Delivery submitted successfully!'),
                  backgroundColor: Colors.green,
                ),
              );
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Failed to submit POD: $e'),
                  backgroundColor: Colors.red,
                ),
              );
            }
          } finally {
            if (mounted) setState(() => _isSubmitting = false);
          }
        },
      ),
    );
  }

  Future<void> _makeCall(String phoneNumber) async {
    final uri = Uri.parse('tel:${phoneNumber.replaceAll(RegExp(r'[^\d+]'), '')}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Cannot make call to $phoneNumber')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final runAsync = ref.watch(driverRunDetailProvider(widget.shipmentId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Run Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(driverRunDetailProvider(widget.shipmentId)),
          ),
        ],
      ),
      body: runAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 12),
              Text('Error: $err', style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(driverRunDetailProvider(widget.shipmentId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (runView) {
          final stops = runView.stops;
          final activeStop = runView.activeStop;
          final deliveredCount = stops.where((s) => s.status.toLowerCase() == 'delivered').length;
          final notStarted = runView.status.toLowerCase() == 'created';

          // Compute valid lat/lng points for the flutter_map
          final mapPoints = stops
              .where((s) => s.latitude != null && s.longitude != null)
              .map((s) => LatLng(s.latitude!, s.longitude!))
              .toList();

          return Stack(
            children: [
              Column(
                children: [
                  // Run Header Banner
                  Container(
                    width: double.infinity,
                    color: Colors.indigo.shade800,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              runView.shipmentCode.isNotEmpty
                                  ? runView.shipmentCode
                                  : 'Run #${runView.shipmentId.substring(0, 8)}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Chip(
                              label: Text(
                                runView.status.toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              backgroundColor: Colors.indigo.shade600,
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$deliveredCount / ${stops.length} Stops Delivered',
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  ),

                  // Route Map View (FlutterMap)
                  SizedBox(
                    height: 180,
                    child: mapPoints.isNotEmpty
                        ? FlutterMap(
                            options: MapOptions(
                              initialCenter: mapPoints.first,
                              initialZoom: 12.0,
                            ),
                            children: [
                              TileLayer(
                                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                userAgentPackageName: 'com.logiflow.mobile',
                              ),
                              PolylineLayer(
                                polylines: [
                                  Polyline(
                                    points: mapPoints,
                                    color: Colors.indigo,
                                    strokeWidth: 4.0,
                                  ),
                                ],
                              ),
                              MarkerLayer(
                                markers: stops
                                    .where((s) => s.latitude != null && s.longitude != null)
                                    .map(
                                      (s) => Marker(
                                        point: LatLng(s.latitude!, s.longitude!),
                                        width: 36,
                                        height: 36,
                                        child: CircleAvatar(
                                          backgroundColor: s == activeStop
                                              ? Colors.amber
                                              : (s.status.toLowerCase() == 'delivered'
                                                  ? Colors.green
                                                  : Colors.indigo),
                                          child: Text(
                                            '${s.sequence}',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                      ),
                                    )
                                    .toList(),
                              ),
                            ],
                          )
                        : Container(
                            color: Colors.grey.shade200,
                            child: const Center(
                              child: Text(
                                'Route map preview (locations loaded with stops)',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ),
                          ),
                  ),

                  // Open Run banner (driver assigned, not yet picked up)
                  if (notStarted)
                    Container(
                      width: double.infinity,
                      color: Colors.indigo.shade50,
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          const Text(
                            'This run is assigned to you and ready for pickup.',
                            style: TextStyle(color: Colors.indigo, fontSize: 13),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              icon: const Icon(Icons.local_shipping),
                              label: const Text('Open run — confirm pickup'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.indigo,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              onPressed: _handleStartRun,
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Run Complete Banner
                  if (runView.isCompleted)
                    Container(
                      width: double.infinity,
                      color: Colors.green.shade100,
                      padding: const EdgeInsets.all(12),
                      child: const Row(
                        children: [
                          Icon(Icons.check_circle, color: Colors.green, size: 28),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Run Complete! All stops delivered.',
                              style: TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Stops List Header
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    color: Colors.grey.shade100,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Delivery Stops (${stops.length})',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: Colors.black87,
                          ),
                        ),
                        const Text(
                          'Ordered Sequence',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),

                  // Stops List View
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: stops.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final stop = stops[index];
                        final isActive = stop == activeStop;

                        return _StopCard(
                          stop: stop,
                          isActive: isActive,
                          canAct: !notStarted,
                          onRecordEvent: (kind) => _handleRecordEvent(stop.stopKey, kind),
                          onOpenPod: () => _openPodSheet(stop),
                          onMakeCall: _makeCall,
                        );
                      },
                    ),
                  ),
                ],
              ),

              if (_isSubmitting)
                Container(
                  color: Colors.black38,
                  child: const Center(child: CircularProgressIndicator()),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _StopCard extends StatelessWidget {
  const _StopCard({
    required this.stop,
    required this.isActive,
    required this.canAct,
    required this.onRecordEvent,
    required this.onOpenPod,
    required this.onMakeCall,
  });

  final TimelineEntry stop;
  final bool isActive;
  final bool canAct;
  final Function(String kind) onRecordEvent;
  final VoidCallback onOpenPod;
  final Function(String phone) onMakeCall;

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
        return Colors.green;
      case 'arrived':
        return Colors.purple;
      case 'enroute':
      case 'en_route':
      case 'departed':
        return Colors.blue;
      case 'pending':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(stop.status);
    final statusLower = stop.status.toLowerCase();

    return Card(
      elevation: isActive ? 4 : 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isActive ? Colors.indigo : Colors.grey.shade300,
          width: isActive ? 2 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stop Sequence & Status header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor: isActive ? Colors.indigo : Colors.grey.shade400,
                      child: Text(
                        '${stop.sequence}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (isActive)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade100,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'ACTIVE STOP',
                          style: TextStyle(
                            color: Colors.amber,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    stop.status.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Address
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on, color: Colors.redAccent, size: 20),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    stop.address,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),

            // Recipient & Call Button
            if (stop.recipientName != null || stop.recipientContact != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (stop.recipientName != null)
                            Text(
                              'Recipient: ${stop.recipientName}',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                          if (stop.recipientContact != null)
                            Text(
                              stop.recipientContact!,
                              style: const TextStyle(fontSize: 12, color: Colors.black87),
                            ),
                        ],
                      ),
                    ),
                    if (stop.recipientContact != null && stop.recipientContact!.isNotEmpty)
                      IconButton.filled(
                        icon: const Icon(Icons.phone, size: 18),
                        style: IconButton.styleFrom(backgroundColor: Colors.green),
                        onPressed: () => onMakeCall(stop.recipientContact!),
                      ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 10),

            // Leg details (ETA, actualAt, distance)
            Wrap(
              spacing: 16,
              runSpacing: 6,
              children: [
                if (stop.plannedEta != null)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.access_time, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        'ETA: ${DateFormat('HH:mm').format(stop.plannedEta!)}',
                        style: const TextStyle(fontSize: 12, color: Colors.black87),
                      ),
                    ],
                  ),
                if (stop.actualAt != null)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check, size: 14, color: Colors.green),
                      const SizedBox(width: 4),
                      Text(
                        'Arrived: ${DateFormat('HH:mm').format(stop.actualAt!)}',
                        style: const TextStyle(fontSize: 12, color: Colors.green),
                      ),
                    ],
                  ),
                if (stop.distanceFromPrevKm != null)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.near_me, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        '${stop.distanceFromPrevKm!.toStringAsFixed(1)} km leg',
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
              ],
            ),

            // Active Stop Action Buttons (hidden until the run is started)
            if (isActive && canAct) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),

              if (statusLower == 'pending') ...[
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.navigation),
                        label: const Text('Mark En Route'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () => onRecordEvent('DEPARTED'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.pin_drop),
                        label: const Text('Mark Arrived'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () => onRecordEvent('ARRIVED'),
                      ),
                    ),
                  ],
                ),
              ] else if (statusLower == 'enroute' || statusLower == 'en_route' || statusLower == 'departed') ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.pin_drop),
                    label: const Text('Mark Arrived at Stop'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: () => onRecordEvent('ARRIVED'),
                  ),
                ),
              ] else if (statusLower == 'arrived') ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.assignment_turned_in),
                    label: const Text('Capture Proof of Delivery (POD)'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onPressed: onOpenPod,
                  ),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _PodFormBottomSheet extends StatefulWidget {
  const _PodFormBottomSheet({
    required this.shipmentId,
    required this.stop,
    required this.onSubmit,
  });

  final String shipmentId;
  final TimelineEntry stop;
  final Function(String name, String? notes, String? photoBase64) onSubmit;

  @override
  State<_PodFormBottomSheet> createState() => _PodFormBottomSheetState();
}

class _PodFormBottomSheetState extends State<_PodFormBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _notesController = TextEditingController();
  File? _imageFile;
  String? _photoBase64;

  @override
  void initState() {
    super.initState();
    if (widget.stop.recipientName != null) {
      _nameController.text = widget.stop.recipientName!;
    }
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 70,
      );
      if (picked != null) {
        final bytes = await File(picked.path).readAsBytes();
        setState(() {
          _imageFile = File(picked.path);
          _photoBase64 = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open camera: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Proof of Delivery - Stop #${widget.stop.sequence}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                widget.stop.address,
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Received By (Recipient Name) *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter the name of the recipient.';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _notesController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Delivery Notes (Optional)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.note),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  OutlinedButton.icon(
                    onPressed: _pickImage,
                    icon: const Icon(Icons.camera_alt),
                    label: Text(_imageFile == null ? 'Take POD Photo' : 'Retake Photo'),
                  ),
                  if (_imageFile != null) ...[
                    const SizedBox(width: 12),
                    const Icon(Icons.check_circle, color: Colors.green),
                    const SizedBox(width: 4),
                    const Text('Photo attached', style: TextStyle(color: Colors.green, fontSize: 12)),
                  ],
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.check),
                  label: const Text('Submit Delivery Complete'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      widget.onSubmit(
                        _nameController.text.trim(),
                        _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
                        _photoBase64,
                      );
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
