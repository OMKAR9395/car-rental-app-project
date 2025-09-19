import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarMaster } from './car-master';

describe('CarMaster', () => {
  let component: CarMaster;
  let fixture: ComponentFixture<CarMaster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarMaster]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarMaster);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
