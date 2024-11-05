import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchivesPointagesComponent } from './archives-pointages.component';

describe('ArchivesPointagesComponent', () => {
  let component: ArchivesPointagesComponent;
  let fixture: ComponentFixture<ArchivesPointagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ArchivesPointagesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArchivesPointagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
