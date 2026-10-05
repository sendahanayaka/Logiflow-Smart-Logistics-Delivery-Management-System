import 'package:flutter_test/flutter_test.dart';
import 'package:logiflow_mobile/features/warehouse/data/models/warehouse_models.dart';

void main() {
  test('UpdateWarehouseRequest serializes to the PUT body', () {
    final json = const UpdateWarehouseRequest(
      name: 'Colombo Central',
      location: 'Colombo',
      totalVolumeM3: 500,
    ).toJson();
    expect(json, {'name': 'Colombo Central', 'location': 'Colombo', 'totalVolumeM3': 500});
  });

  test('UpdateStorageZoneRequest serializes to the PUT body', () {
    final json = const UpdateStorageZoneRequest(name: 'Zone A', code: 'A1', totalVolumeM3: 120)
        .toJson();
    expect(json, {'name': 'Zone A', 'code': 'A1', 'totalVolumeM3': 120});
  });

  test('UpdatePackageRequest serializes zone move + null special handling', () {
    final json = const UpdatePackageRequest(
      storageZoneId: 'zone-2',
      weightKg: 12.5,
      volumeM3: 0.8,
      isFragile: true,
    ).toJson();
    expect(json, {
      'storageZoneId': 'zone-2',
      'weightKg': 12.5,
      'volumeM3': 0.8,
      'isFragile': true,
      'specialHandling': null,
    });
  });
}
