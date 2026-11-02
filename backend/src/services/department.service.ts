import { DepartmentRepository } from '../repositories/department.repository';
import type { Department } from '../types';

export class DepartmentService {
  constructor(private readonly departmentRepo: DepartmentRepository = new DepartmentRepository()) {}

  public getDepartments(): Department[] {
    return this.departmentRepo.findAll();
  }

  public getDepartmentById(id: number): Department | null {
    const dept = this.departmentRepo.findById(id);
    return dept || null;
  }
}
