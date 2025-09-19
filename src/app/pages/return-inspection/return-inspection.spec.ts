import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnInspection } from './return-inspection';

describe('ReturnInspection', () => {
  let component: ReturnInspection;
  let fixture: ComponentFixture<ReturnInspection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnInspection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReturnInspection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
