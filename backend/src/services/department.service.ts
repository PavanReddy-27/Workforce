import { DepartmentRepository } from '../repositories/department.repository';
import type { Department } from '../types';

export class DepartmentService {
  constructor(private readonly departmentRepo: DepartmentRepository = new DepartmentRepository()) {}

  public getDepartments(departmentId?: number): Department[] {
    const departments = this.departmentRepo.findAll();
    return departmentId === undefined
      ? departments
      : departments.filter((department) => department.id === departmentId);
  }

  public getDepartmentById(id: number): Department | null {
    const dept = this.departmentRepo.findById(id);
    return dept || null;
  }
}
